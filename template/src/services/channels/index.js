import { File, Text } from "@asyncapi/generator-react-sdk";
import { render } from "ejs";
import { ChannelDTO, ChannelDTOEvaluator } from "../../../../src/channel-dto-evaluator/channel-dto-evaluator";
import { ClassHierarchyEvaluator } from "../../../../src/class-hierarchy-evaluator/class-hierrachy-evaluator";
import { Utils } from "../../../../src/utils";

const fs = require('fs');

export default function ({ asyncapi, params, originalAsyncAPI }) {
    const servicesNamespace = params.servicesNamespace;
    const modelsNamespace = params.modelsNamespace;

    const classHierarchyEvaluator = new ClassHierarchyEvaluator(asyncapi, modelsNamespace);
    const classHierarchy = classHierarchyEvaluator.evaluate();

    const channelDTOEvaluator = new ChannelDTOEvaluator(classHierarchy, servicesNamespace, modelsNamespace);
    const dtos = channelDTOEvaluator.evaluate(asyncapi);

    const files = dtos.map((dto) => renderChannelClassFile(dto));

    return files;
}

/**
 * 
 * @param {ChannelDTO} dto 
 * @returns {JSX.Element}
 */
function renderChannelClassFile(dto) {
    const template = fs.readFileSync(
        __dirname + '/../../../../src/ejs-templates/channel-class.ejs',
        { encoding: 'utf8', flag: 'r' }
    );

    const usedClasses = [];
    if (dto.publishOperation) {
        usedClasses.push(dto.publishOperation.payload.name);
        for (const subClass of dto.publishOperation.payload.subClasses) {
            usedClasses.push(subClass.name);
        }
    }
    if (dto.subscribeOperation) {
        usedClasses.push(dto.subscribeOperation.payload.name);
        for (const subClass of dto.subscribeOperation.payload.subClasses) {
            usedClasses.push(subClass.name);
        }
    }
    const usedClassesDeduped = [... new Set(usedClasses)];

    const output = render(template, {
        ...dto,
        usedClasses: usedClassesDeduped,
        lowerCaseFirst: Utils.lowerCaseFirst
    });

    const fileName = `${dto.channelClassNamePrefix}Channel.class.php`;

    return (
        <File name={fileName}>
            <Text>{output}</Text>
        </File>
    );
}

