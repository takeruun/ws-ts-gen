export interface AsyncAPIDocument {
  asyncapi: string;
  info: {
    title: string;
    version: string;
    description?: string;
  };
  servers?: {
    [key: string]: {
      host: string;
      port?: number;
      protocol: string;
      pathname?: string;
      description?: string;
    };
  };
  defaultContentType?: string;
  channels: {
    [key: string]: {
      address: string;
      messages: {
        [key: string]: {
          $ref?: string;
        };
      };
    };
  };
  operations?: {
    [key: string]: {
      action: 'send' | 'receive';
      description?: string;
      channel: {
        $ref: string;
      };
      messages?: Array<{
        $ref: string;
      }>;
    };
  };
  components: {
    messages: {
      [key: string]: {
        name: string;
        title: string;
        summary?: string;
        contentType: string;
        payload: {
          $ref: string;
        };
      };
    };
    schemas: {
      [key: string]: {
        type: string;
        required?: string[];
        properties: {
          [key: string]: {
            type: string;
            const?: string;
            description?: string;
            items?: any;
            properties?: any;
          };
        };
      };
    };
  };
}

export interface GeneratorOptions {
  schema: string;
  out: string;
  mode: 'server' | 'client' | 'both';
  generateTypes?: boolean;
  generateServer?: boolean;
  generateClient?: boolean;
  generateHandlers?: boolean;
}