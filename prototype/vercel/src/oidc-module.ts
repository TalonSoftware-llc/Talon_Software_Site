declare module "oidc-provider" {
  import type { IncomingMessage, ServerResponse } from "node:http";

  export interface InteractionDetails {
    uid: string;
    prompt: { name: string };
  }

  export class Provider {
    constructor(issuer: string, configuration: Record<string, unknown>);
    callback(): (req: IncomingMessage, res: ServerResponse) => void;
    interactionDetails(req: IncomingMessage, res: ServerResponse): Promise<InteractionDetails>;
    interactionFinished(
      req: IncomingMessage,
      res: ServerResponse,
      result: Record<string, unknown>,
      options?: { mergeWithLastSubmission?: boolean },
    ): Promise<void>;
  }

  export const interactionPolicy: {
    base: () => { remove: (name: string) => void };
  };

  export default Provider;
}
