import { Injectable, LogLevel, Logger, LoggerService } from '@nestjs/common';

type LoggerMessageType = 'create' | 'list' | 'get' | 'delete' | 'update';
type ServerType = 'request' | 'response' | 'error';

interface MessageInput {
  loggerType?: LoggerMessageType;
  entity?: string;
  customerMessage?: string;
  serverType?: ServerType;
}

@Injectable()
export class LoggerServerService implements LoggerService {
  private logger: Logger;
  constructor() {
    this.logger = new Logger();
  }

  private getMessageLogDefault = (message: string, type?: ServerType) => {
    if (type === 'request') {
      return `[${message}] 🚀 Request >>>>>>>>>>>>>>>`;
    } else if (type === 'response') {
      return `[${message}] 🟢 Response >>>>>>>>>>>>>>>`;
    } else if (type === 'error') {
      return `[${message}] X Error >>>>>>>>>>>>>>>`;
    }
    return `[${message}] Log >>>>>>>>>>>>>>>`;
  };

  private getMessage = ({
    loggerType,
    entity,
    customerMessage,
    serverType,
  }: MessageInput) => {
    switch (loggerType) {
      case 'create':
        return this.getMessageLogDefault(`Create${entity}`, serverType);
      case 'list':
        return this.getMessageLogDefault(`List${entity}`, serverType);
      case 'get':
        return this.getMessageLogDefault(`Get${entity}`, serverType);
      case 'delete':
        return this.getMessageLogDefault(`Delete${entity}`, serverType);
      case 'update':
        return this.getMessageLogDefault(`Update${entity}`, serverType);
      default:
        return this.getMessageLogDefault(customerMessage, serverType);
    }
  };

  log(message: MessageInput, ...optionalParams: any[]) {
    this.logger.log(this.getMessage(message), ...optionalParams);
  }

  error(message: MessageInput, ...optionalParams: any[]) {
    this.logger.error(this.getMessage(message), ...optionalParams);
  }

  warn(message: MessageInput, ...optionalParams: any[]) {
    this.logger.warn(this.getMessage(message), ...optionalParams);
  }

  debug?(message: MessageInput, ...optionalParams: any[]) {
    this.logger.debug(this.getMessage(message), ...optionalParams);
  }

  verbose?(message: MessageInput, ...optionalParams: any[]) {
    this.logger.verbose(this.getMessage(message), ...optionalParams);
  }

  fatal?(message: MessageInput, ...optionalParams: any[]) {
    this.logger.fatal(this.getMessage(message), ...optionalParams);
  }

  setLogLevels?(levels: LogLevel[]) {
    this.setLogLevels(levels);
  }
}
