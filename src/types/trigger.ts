import { getLogger } from "src/utils";
import { AbstractShareable } from "./cloud";
import { ChaiteContext } from "./common";
import schedule, { Job } from '@karinjs/node-schedule';
import { Chaite } from "src";

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
    
    // 处理LLM对话后的响应
    handleResponse(response: string, context: ChaiteContext): Promise<void>;
}

// 基础触发器抽象类
export abstract class BaseTrigger implements Trigger {
    id: string;
    name: string;
    description: string;
    isOneTime?: boolean;
    
    constructor(params: {id: string; name: string; description: string; isOneTime?: boolean}) {
        this.id = params.id;
        this.name = params.name;
        this.description = params.description;
        this.isOneTime = params.isOneTime || false;
    }
    
    abstract register(context: ChaiteContext): Promise<void>;
    abstract unregister(): Promise<void>;
    
    // 提供一个默认的响应处理方法，子类可以覆盖
    async handleResponse(response: string, context: ChaiteContext): Promise<void> {
        getLogger().debug(`触发器 ${this.name} 收到响应: ${response}`);
    }
    
    // 辅助方法：调用LLM对话
    protected async invokeDialog(prompt: string, context: ChaiteContext): Promise<string> {
        // 实际调用LLM对话的逻辑，需要根据你的系统实现
        // 这里仅为示例
        return `LLM response to: ${prompt}`;
    }
}

export abstract class CronTrigger extends BaseTrigger {
    protected cronExpression: string;
    protected cronJob?: Job;
    
    constructor(params: {id: string; name: string; description: string; cronExpression: string; isOneTime?: boolean}) {
        super(params);
        this.cronExpression = params.cronExpression;
    }
    
    async register(context: ChaiteContext): Promise<void> {
        if (this.isOneTime) {
            // 对于一次性触发器，我们使用一次性任务
            const date = new Date(Date.now() + 1000); // 1秒后执行，可根据需要调整
            this.cronJob = schedule.scheduleJob(date, async () => {
                try {
                    await this.execute(context);
                    // 一次性触发器执行后自动注销并删除
                    const triggerManager = Chaite.getInstance().getTriggerManager();
                    await triggerManager.deleteInstance(this.id);
                } catch (err) {
                    getLogger().error(`一次性触发器 ${this.name} 执行出错:`, err as never);
                }
            });
            getLogger().info(`一次性触发器 ${this.name} 已注册，将在指定时间执行一次`);
        } else {
            // 对于普通触发器，使用原来的 cron 表达式
            this.cronJob = schedule.scheduleJob(this.cronExpression, () => {
                this.execute(context).catch(err => {
                    getLogger().error(`触发器 ${this.name} 执行出错:`, err as never);
                });
            });
            getLogger().info(`触发器 ${this.name} 已注册，cron表达式: ${this.cronExpression}`);
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

export abstract class OneTimeEventTrigger extends BaseTrigger {
    protected bot: any; // Bot 实例
    protected eventName: string;
    protected eventHandler: (...args: any[]) => void;
    private isRegistered: boolean = false;
    
    constructor(params: {id: string; name: string; description: string; eventName: string; bot: any}) {
        super({...params, isOneTime: true});
        this.eventName = params.eventName;
        this.bot = params.bot;
        this.eventHandler = this.handleEvent.bind(this);
    }
    
    async register(context: ChaiteContext): Promise<void> {
        if (this.isRegistered) return;
        
        // 创建一个包装函数，处理事件后自动注销
        const wrappedHandler = async (...args: any[]) => {
            try {
                if (await this.shouldHandle(...args)) {
                    await this.handleEvent(...args);
                    // 注销并删除自身
                    await this.unregister();
                    
                    // 通知 TriggerManager 删除此触发器
                    const triggerManager = Chaite.getInstance().getTriggerManager();
                    await triggerManager.deleteInstance(this.id);
                }
            } catch (err) {
                getLogger().error(`一次性事件触发器 ${this.name} 处理出错:`, err as never);
                // 出错也应该注销，避免重复触发
                await this.unregister();
            }
        };
        
        this.eventHandler = wrappedHandler;
        this.bot.on(this.eventName, this.eventHandler);
        this.isRegistered = true;
        
        getLogger().info(`一次性事件触发器 ${this.name} 已注册，监听事件: ${this.eventName}`);
    }
    
    async unregister(): Promise<void> {
        if (!this.isRegistered) return;
        
        this.bot.off(this.eventName, this.eventHandler);
        this.isRegistered = false;
        
        getLogger().info(`一次性事件触发器 ${this.name} 已注销`);
    }
    
    // 子类实现：判断是否应该处理此事件
    protected abstract shouldHandle(...args: any[]): Promise<boolean>;
    
    // 子类实现：事件处理逻辑
    protected abstract handleEvent(...args: any[]): Promise<void>;
}