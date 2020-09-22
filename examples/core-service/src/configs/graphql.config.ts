import { GqlModuleOptions } from '@nestjs/graphql';

interface IContextFunction {
  connection: {
    context: Record<string, unknown>;
  };
  req: Record<string, unknown>;
}

export const graphqlConfig: GqlModuleOptions = {
  typePaths: ['./src/schemas/*.graphql'],
  debug: true,
  playground: true,
  introspection: true,
  installSubscriptionHandlers: true,
  subscriptions: { keepAlive: 30 * 1000 },
  context: ({ req, connection }: IContextFunction) => {
    if (connection) {
      return {
        req: {
          headers: {
            authorization:
              connection.context.authorization ||
              connection.context.Authorization,
          },
        },
      };
    }
    return { req };
  },
};
