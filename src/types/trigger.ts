import { getLogger } from "src/utils";
import { AbstractShareable } from "./cloud";
import { ChaiteContext } from "./common";
import schedule, { Job } from '@karinjs/node-schedule';

export class TriggerDTO extends AbstractShareable<TriggerDTO> {
    constructor(params: Partial<TriggerDTO>) {
        super(params)
        this.modelType = 'executable'
        this.status = params.status || 'enabled'
    }

    status: 'enabled' | 'disabled'

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
    
    // 初始化和注册触发器的方法
    register(context: ChaiteContext): void | Promise<void>;
    
    // 卸载/停止触发器的方法
    unregister(): void | Promise<void>;
    
    // 处理LLM对话后的响应
    handleResponse(response: string, context: ChaiteContext): Promise<void>;
}

// 基础触发器抽象类
export abstract class BaseTrigger implements Trigger {
    id: string;
    name: string;
    description: string;
    
    constructor(params: {id: string; name: string; description: string}) {
        this.id = params.id;
        this.name = params.name;
        this.description = params.description;
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
    
    constructor(params: {id: string; name: string; description: string; cronExpression: string}) {
        super(params);
        this.cronExpression = params.cronExpression;
    }
    
    async register(context: ChaiteContext): Promise<void> {
        this.cronJob = schedule.scheduleJob(this.cronExpression, () => {
            this.execute(context).catch(err => {
                getLogger().error(`触发器 ${this.name} 执行出错:`, err as never);
            });
        });
        getLogger()

        getLogger().info(`触发器 ${this.name} 已注册，cron表达式: ${this.cronExpression}`);
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