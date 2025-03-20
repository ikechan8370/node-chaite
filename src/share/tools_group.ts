import {NonExecutableShareableManager} from "./shareable";
import {BasicStorage, ToolsGroupDTO} from "../types";

export class ToolsGroupManager extends NonExecutableShareableManager<ToolsGroupDTO> {
  private static instance: ToolsGroupManager

  private constructor(storage: BasicStorage<ToolsGroupDTO>) {
    super('tools-group', storage)
  }

  public static async init(storage: BasicStorage<ToolsGroupDTO>) {
    if (ToolsGroupManager.instance) {
      return ToolsGroupManager.instance
    }
    ToolsGroupManager.instance = new ToolsGroupManager(storage)
    return ToolsGroupManager.instance
  }

  public static async getInstance(): Promise<ToolsGroupManager | null> {
    if (!ToolsGroupManager.instance) {
      return null
    }
    return ToolsGroupManager.instance
  }
}