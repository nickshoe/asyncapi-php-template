import { File, Text } from "@asyncapi/generator-react-sdk";
import { render } from "ejs";
import { Utils } from "../../../../src/utils";

const fs = require('fs');

export default function ({ asyncapi, params, originalAsyncAPI }) {
    const servicesNamespace = params.servicesNamespace;

    const files = [
        ...renderBaseClientFiles(servicesNamespace),
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
        'MessageAckHandler.php.ejs',
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
