import { getLogger } from "src/utils";
import { AbstractShareable } from "./cloud";
import { ChaiteContext } from "./common";
import schedule, { Job } from '@karinjs/node-schedule';
import { Chaite, ChatPreset, createClient, ModelResponse, SendMessageOption, UserMessage } from "src";

export class TriggerDTO extends AbstractShareable<TriggerDTO> {
    constructor(params: Partial<TriggerDTO>) {
        super(params)
        this.modelType = 'executable'
        this.status = params.status || 'enabled'
        this.isOneTime = params.isOneTime || false
    }

    status: 'enabled' | 'disabled'
    isOneTime?: boolean

    fromString(str: string): TriggerDTO {
        return new TriggerDTO(JSON.parse(str))
    }

    toFormatedString(verbose?: boolean): string {
        let base = `触发器ID: ${this.id}\n`
        if (this.name) {
            base += `触发器名称：${this.name}`
        }
        if (this.description) {
            base += `\n触发器描述：${this.description}`
        }
        if (this.status) {
            base += `\n触发器状态：${this.status}`
        }
        if (this.createdAt) {
            base += `\n创建时间：${this.createdAt}`
          }
      
          if (this.updatedAt) {
            base += `\n最后更新时间：${this.updatedAt}`
          }
      
          if (this.uploader?.username) {
            base += `\n上传者：@${this.uploader.username}`
          }
      
          return base.trimEnd()
    }
}

export interface Trigger {
    id: string;
    name: string;
    description: string;

    // 是否为一次性触发器
    isOneTime?: boolean;

    // 初始化和注册触发器的方法
    register(context: ChaiteContext): Promise<void>;
    
    // 卸载/停止触发器的方法
    unregister(): Promise<void>;

    queryLLM(message: UserMessage, options: SendMessageOption & { chatPreset?: ChatPreset }): Promise<ModelResponse>;
    
}

// 基础触发器抽象类
export abstract class BaseTrigger implements Trigger {
    id: string;
    name: string;
    description: string;
    isOneTime?: boolean;
    private triggerExecuted: boolean = false;
    
    constructor(params: {id: string; name: string; description: string; isOneTime?: boolean}) {
        this.id = params.id;
        this.name = params.name;
        this.description = params.description;
        this.isOneTime = params.isOneTime || false;
    }
    
    // 子类需要实现的注册方法
    protected abstract registerImpl(context: ChaiteContext): Promise<void>;
    
    // 子类需要实现的注销方法
    protected abstract unregisterImpl(): Promise<void>;

    async register(context: ChaiteContext): Promise<void> {
        this.triggerExecuted = false;
        await this.registerImpl(context);
        getLogger().debug(`触发器 ${this.name} 注册成功 ${this.isOneTime ? '(一次性)' : ''}`);
    }

    async unregister(): Promise<void> {
        await this.unregisterImpl();
        getLogger().debug(`触发器 ${this.name} 已注销`);
    }

    protected async checkOneTimeAndCleanup(): Promise<boolean> {
        if (this.isOneTime && !this.triggerExecuted) {
            this.triggerExecuted = true;
            
            // 延迟执行注销和删除，确保当前操作完成
            setTimeout(async () => {
                try {
                    await this.unregister();
                    const triggerManager = Chaite.getInstance().getTriggerManager();
                    await triggerManager.deleteInstance(this.id);
                    getLogger().info(`一次性触发器 ${this.name} 已执行完毕并自动删除`);
                } catch (err) {
                    getLogger().error(`一次性触发器 ${this.name} 清理出错:`, err as never);
                }
            }, 100);
            
            return true;
        }
        return false;
    }

    protected async triggerAction(action: () => Promise<void>): Promise<void> {
        try {
            // 先执行实际动作
            await action();
            
            // 如果是一次性触发器，则执行清理
            await this.checkOneTimeAndCleanup();
        } catch (err) {
            getLogger().error(`触发器 ${this.name} 执行出错:`, err as never);
            // 即使出错也要执行清理
            if (this.isOneTime) {
                await this.checkOneTimeAndCleanup();
            }
        }
    }

    async queryLLM(message: UserMessage, options: SendMessageOption & { chatPreset?: ChatPreset }): Promise<ModelResponse> {
        let preset = options.chatPreset
        if (preset) {
            options = preset.sendMessageOption
        }
        const channels = await Chaite.getInstance().getChannelsManager().getChannelByModel(options.model || '')
        if (channels.length > 0) {
            const channel = channels[0]
            await channel.options.ready()
            const client = createClient(channel.adapterType, channel.options)
            options.conversationId = crypto.randomUUID()
            options.parentMessageId = crypto.randomUUID()
            const response = await client.sendMessage(message, options)
            return response
        }
        throw new Error('No channel found')
    }

}

export abstract class CronTrigger extends BaseTrigger {
    protected cronExpression: string;
    protected cronJob?: Job;
    
    constructor(params: {id: string; name: string; description: string; cronExpression: string; isOneTime?: boolean}) {
        super(params);
        this.cronExpression = params.cronExpression;
    }
    
    protected async registerImpl(context: ChaiteContext): Promise<void> {
        if (this.isOneTime) {
            // 对于一次性触发器，使用一次性任务
            const date = new Date(Date.now() + 1000); // 1秒后执行，可根据需要调整
            this.cronJob = schedule.scheduleJob(date, () => {
                this.triggerAction(() => this.execute(context));
            });
        } else {
            // 对于普通触发器，使用原来的cron表达式
            this.cronJob = schedule.scheduleJob(this.cronExpression, () => {
                this.execute(context).catch(err => {
                    getLogger().error(`触发器 ${this.name} 执行出错:`, err as never);
                });
            });
        }
    }

    protected async unregisterImpl(): Promise<void> {
        if (this.cronJob) {
            this.cronJob.cancel();
            this.cronJob = undefined;
        }
    }
    
    async unregister(): Promise<void> {
        if (this.cronJob) {
            this.cronJob.cancel();
            this.cronJob = undefined;
            getLogger().info(`触发器 ${this.name} 已取消注册`);
        }
    }
    
    // 子类需要实现的定时执行方法
    protected abstract execute(context: ChaiteContext): Promise<void>;
}

// 事件触发器
export abstract class EventTrigger extends BaseTrigger {
    protected bot: any; // Bot实例
    protected eventName: string;
    protected eventHandler: (...args: any[]) => void;
    private isRegistered: boolean = false;
    
    constructor(params: {id: string; name: string; description: string; eventName: string; bot: any; isOneTime?: boolean}) {
        super(params);
        this.eventName = params.eventName;
        this.bot = params.bot;
        this.eventHandler = this.handleEvent.bind(this);
    }
    
    async register(context: ChaiteContext): Promise<void> {
        if (this.isRegistered) return;
        
        if (this.isOneTime) {
            // 创建一个包装函数，处理事件后自动注销
            const wrappedHandler = async (...args: any[]) => {
                try {
                    await this.handleEvent(...args);
                    // 注销并删除自身
                    await this.unregister();
                    
                    // 通知 TriggerManager 删除此触发器
                    const triggerManager = Chaite.getInstance().getTriggerManager();
                    await triggerManager.deleteInstance(this.id);
                } catch (err) {
                    getLogger().error(`一次性事件触发器 ${this.name} 处理出错:`, err as never);
                    // 出错也应该注销，避免重复触发
                    await this.unregister();
                }
            };
            this.eventHandler = wrappedHandler;
        }
        
        this.bot.on(this.eventName, this.eventHandler);
        this.isRegistered = true;
        
        getLogger().info(`${this.isOneTime ? '一次性' : ''}事件触发器 ${this.name} 已注册，监听事件: ${this.eventName}`);
    }
    
    async unregister(): Promise<void> {
        if (!this.isRegistered) return;
        
        this.bot.off(this.eventName, this.eventHandler);
        this.isRegistered = false;
        
        getLogger().info(`事件触发器 ${this.name} 已注销`);
    }
    
    // 子类实现：事件处理逻辑
    protected abstract handleEvent(...args: any[]): Promise<void>;
}