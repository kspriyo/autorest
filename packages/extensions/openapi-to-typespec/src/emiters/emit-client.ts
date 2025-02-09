import { getSession } from "../autorest-session";
import { generateArmResourceClientDecorator, generateObjectClientDecorator } from "../generate/generate-client";
import { TypespecProgram } from "../interfaces";
import { getOptions } from "../options";
import { formatTypespecFile } from "../utils/format";
import { getClientImports } from "../utils/imports";
import { getNamespace } from "../utils/namespace";

export async function emitClient(filePath: string, program: TypespecProgram): Promise<void> {
  const content = generateClient(program);

  if (content === "") {
    return;
  }
  const session = getSession();
  session.writeFile({ filename: filePath, content: await formatTypespecFile(content, filePath) });
}

function generateClient(program: TypespecProgram) {
  const { isArm } = getOptions();
  const { models } = program;
  const { modules, namespaces: namespacesSet } = getClientImports(program);
  const imports = [...new Set<string>([`import "./main.tsp";`, ...modules])].join("\n");

  const namespaces = [...new Set<string>([...namespacesSet, `using ${getNamespace(program)};`])].join("\n");
  const objects = models.objects
    .map(generateObjectClientDecorator)
    .filter((r) => r !== "")
    .join("\n\n");

  const armResources = isArm
    ? models.armResources
        .map(generateArmResourceClientDecorator)
        .filter((r) => r !== "")
        .join("\n\n")
    : "";
  if (objects === "" && armResources === "") {
    return "";
  }
  return [imports, "\n", namespaces, "\n", objects, "\n", armResources].join("\n");
}
