import { File, Text } from "@asyncapi/generator-react-sdk";
import { render } from "ejs";
import { Utils } from "../../../../src/utils";

const fs = require('fs');

export default function ({ asyncapi, params, originalAsyncAPI }) {
    const servicesNamespace = params.servicesNamespace;

    let specificClientFiles = [];
    switch (params.protocol) {
        case "amqp":
            specificClientFiles = renderAMQPClientFiles(servicesNamespace);
            break;
        case "kafka":
            specificClientFiles = renderKafkaClientFiles(servicesNamespace);
            break;
        default:
            throw new Error(`Protocol ${params.protocol} not supported for client code generation.`);
    }

    const files = [
        ...renderBaseClientFiles(servicesNamespace),
        ...specificClientFiles
    ];

    return files;
}

/**
 * 
 * @param {string} servicesNamespace 
 * @returns {JSX.Element[]}
 */
function renderBaseClientFiles(servicesNamespace) {
    return [
        'Client.php.ejs',
        'ClientConfig.php.ejs',
        'Destination.php.ejs',
        'Message.php.ejs',
        'Subscription.php.ejs',

    ]
        .map((templateFileName) => ({
            fileName: templateFileName,
            content: fs.readFileSync(
                __dirname + '/../../../../src/ejs-templates/MessageBroker/' + templateFileName,
                { encoding: 'utf8', flag: 'r' }
            ),
        }))
        .map((template) => ({
            ...template,
            outputFileName: template.fileName.replace('.ejs', ''),
            outputContent: render(template.content, {
                servicesNamespace,
                lowerCaseFirst: Utils.lowerCaseFirst
            })
        }))
        .map((compiledTemplate) => (
            <File name={compiledTemplate.outputFileName}>
                <Text>{compiledTemplate.outputContent}</Text>
            </File>
        ));
}

/**
 * 
 * @param {string} servicesNamespace 
 * @returns {JSX.Element[]}
 */
function renderAMQPClientFiles(servicesNamespace) {
    return [
        'AMQPClient.php.ejs',
        'AMQPClientConfig.php.ejs',
        'AMQPMessageAckHandler.php.ejs'
    ]
        .map((templateFileName) => ({
            fileName: templateFileName,
            content: fs.readFileSync(
                __dirname + '/../../../../src/ejs-templates/MessageBroker/AMQP/' + templateFileName,
                { encoding: 'utf8', flag: 'r' }
            ),
        }))
        .map((template) => ({
            ...template,
            outputFileName: 'AMQP/' + template.fileName.replace('.ejs', ''),
            outputContent: render(template.content, {
                servicesNamespace,
                lowerCaseFirst: Utils.lowerCaseFirst
            })
        }))
        .map((compiledTemplate) => (
            <File name={compiledTemplate.outputFileName}>
                <Text>{compiledTemplate.outputContent}</Text>
            </File>
        ));
}

/**
 * 
 * @param {string} servicesNamespace 
 * @returns {JSX.Element[]}
 */
function renderKafkaClientFiles(servicesNamespace) {
    return [
        'KafkaClient.php.ejs',
        'KafkaClientConfig.php.ejs',
        'RdKafkaMessageAckHandler.php.ejs'
    ]
        .map((templateFileName) => ({
            fileName: templateFileName,
            content: fs.readFileSync(
                __dirname + '/../../../../src/ejs-templates/MessageBroker/Kafka/' + templateFileName,
                { encoding: 'utf8', flag: 'r' }
            ),
        }))
        .map((template) => ({
            ...template,
            outputFileName: 'Kafka/' + template.fileName.replace('.ejs', ''),
            outputContent: render(template.content, {
                servicesNamespace,
                lowerCaseFirst: Utils.lowerCaseFirst
            })
        }))
        .map((compiledTemplate) => (
            <File name={compiledTemplate.outputFileName}>
                <Text>{compiledTemplate.outputContent}</Text>
            </File>
        ));
}