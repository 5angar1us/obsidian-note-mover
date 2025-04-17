import { App, normalizePath, TAbstractFile, TFile, TFolder, Vault } from "obsidian";
import { ExcludedFolder as ExcludedFolderRule, NoteMoverSettings, Rule } from "./settings";
import { getAPI, DataviewApi } from "obsidian-dataview";
import { log } from "./logger/CompositeLogger";

export type FileCheckFn = (path: string) => TAbstractFile | null;
export type RenameFileFn = (file: TFile, newPath: string) => Promise<void>
export type Caller = 'cmd' | 'auto';


export async function handleFiles(app: App, file: TAbstractFile, сaller: Caller, settings: NoteMoverSettings, oldPath?: string,) {
    //TODO Автоматический режим активации - добавить в настройки триггер
    //проверка this.settings.trigger_auto_manual !== 'Automatic' && caller !== 'cmd'

    if (!(file instanceof TFile)) return;

    log.logMessage(`id:${file.name} Start processing move of file`);

    const fileName = file.basename; // fileName
    const fileFullName = createFullName(file); // fileName.extention

    if (oldPath && !shouldProcessRename(fileFullName, oldPath)) {
        return;
    }

    if (isFileInExcludedFolder(file, settings.excludedFolders)) {
        return;
    }

    const getAbstractFileFn: FileCheckFn = (path: string) => app.vault.getAbstractFileByPath(normalizePath(path))
    const renameFileFn: RenameFileFn = async (oldName, newName) => app.fileManager.renameFile(oldName, newName); // TODO написакть почему именно его а не move
    const dataviewApi: DataviewApi = getAPI(app) as DataviewApi;

    log.logMessage(`id:${file.name} Rule check initiated`);

    for (const rule of settings.rules) {

        const currentPath = normalizePath(file.path);
        const targetPath = normalizePath(`${rule.targetFolder}/${fileFullName}`);

        const parentFolder = file.parent!; // TODO root folder как обабатывать???

        if (!FileInSourceFolder(parentFolder.path, rule.sourceFolder)) { //TODO рекурсивно???
            continue;
        }

        const isFileFollowsRule = FileFollowsRule(dataviewApi, rule, currentPath)

        if (!isFileFollowsRule)
            continue;

        if (AlreadyInTargetFolder(currentPath, targetPath)) {
            log.logMessage(`id:${file.name} A file already in target directory.`);
            continue;
        }

        const existingFile = getAbstractFileFn(targetPath);
        if (existingFile instanceof TFile) {
            log.logMessage(`id:${file.name} Target path "${targetPath}" already contains a file with same name.`);
            continue;
        }

        try {
            await renameFileFn(file, targetPath);

            log.logMessage(`id:${file.name} Moved the note "${fileFullName}" to "${rule.targetFolder}".`)
        } catch (error) {
            log.logError(`id:${file.name} Failed to move file. Error: ${error}`);
        }
    }
}

function FileInSourceFolder(parentFolderPath: string, sourceFolderPath: string) {
    return parentFolderPath === sourceFolderPath;
}

async function FileFollowsRule(dataviewApi: DataviewApi, rule: Rule, fullFilePath: string) {


    // TODO как это будет работать с другими file.extention?
    // Alternative WHERE file.path (with .extention)
    let query = `
    LIST
    FROM "${fullFilePath}"
    WHERE ${rule.filter}`;

    log.logMessage(`id:${file.name} query:${query}`)

    try {
        const result = await dataviewApi.tryQuery(query, this.app.workspace.getActiveFile()?.path);
        if (result.values.length > 1) {
            throw new Error("Only one element is expected as a result of the query execution.");
        }
        return result.values.length === 1;

    } catch (error) {
        throw error;
    }
}


function AlreadyInTargetFolder(currentPath: string, targetPath: string,) {
    return currentPath === targetPath;
}

function isFileInExcludedFolder(
    file: TFile,
    excludedFolders: ExcludedFolderRule[],
  ): boolean {
    if (!file.parent) return false;
  
    const normalizedFileFolder = normalizePath(file.parent.path);
  
    return excludedFolders.some(excluded => {
      if (!excluded.folderPath) return false;
  
      const normalizedExcludedFolder = normalizePath(excluded.folderPath);
  
      if (excluded.withSubfolders) {
        return normalizedFileFolder === normalizedExcludedFolder ||
               normalizedFileFolder.startsWith(normalizedExcludedFolder);
      }
  
      return normalizedFileFolder === normalizedExcludedFolder;
    });
  }
  

function shouldProcessRename(newFilename: string, oldPath?: string) {
    if (!oldPath) return false;

    const oldFilename = oldPath.split('/').pop();

    return oldFilename !== newFilename;
}

function createFullName(file: TFile) {
    return `${file.basename}.${file.extension}`
}

