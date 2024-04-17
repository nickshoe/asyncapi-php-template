import { File, Text } from "@asyncapi/generator-react-sdk";
import { AsyncAPIDocument } from "@asyncapi/parser";
import { AMQP_PROTOCOL, KAFKA_PROTOCOL } from "./constants";

export class ComposerFileRenderer {

    /**
     * 
     * @param {AsyncAPIDocument} asyncapi 
     * @param {Object} params
     * @returns {JSX.Element}
     */
    render(asyncapi, params) {
        const serverName = params.server;

        const server = asyncapi.server(serverName);
        const serverProtocol = server.protocol();

        const composerDependencies = new Map();
        const composerDevDependencies = new Map();

        composerDependencies.set('jms/serializer', '^3.30');
        composerDependencies.set('doctrine/annotations', '^2.0');
        composerDependencies.set('ramsey/uuid', '^4.7');

        switch (serverProtocol) {
            case AMQP_PROTOCOL:
                composerDependencies.set('php-amqplib/php-amqplib', '^3.5');
                break;
            case KAFKA_PROTOCOL:
                composerDevDependencies.set('kwn/php-rdkafka-stubs', '^2.2');
                break;
            default:
                throw new Error(`Server protocol '${serverProtocol}' not supported by the generator.`);
        }

        const require = {};
        for (const [name, version] of composerDependencies.entries()) {
            require[name] = version;
        }

        const requireDev = {}
        for (const [name, version] of composerDevDependencies.entries()) {
            requireDev[name] = version;
        }

        const composerManifest = {
            require: require,
            autoload: {
                classmap: ['src/']
            },
            'require-dev': requireDev
        };

        const composerBlock = JSON.stringify(composerManifest, '', 2);

        return <File name="composer.json">
            <Text>{composerBlock}</Text>
        </File>;
    }
}
