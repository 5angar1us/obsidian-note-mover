import { App, normalizePath, TAbstractFile, TFile, TFolder, Vault } from "obsidian";
import { ExcludedFolder as ExcludedFolderRule, NoteMoverSettings, Rule } from "./settings";
import { getAPI, DataviewApi } from "obsidian-dataview";

export type FileCheckFn = (path: string) => TAbstractFile | null;
export type RenameFileFn = (file: TFile, newPath: string) => Promise<void>
export type Caller = 'cmd' | 'auto';


export async function handleFiles(app: App, file: TAbstractFile, сaller: Caller, settings: NoteMoverSettings, oldPath?: string,) {
    //TODO Автоматический режим активации - добавить в настройки триггер
    //проверка this.settings.trigger_auto_manual !== 'Automatic' && caller !== 'cmd'

    if (!(file instanceof TFile)) return;

    console.log(`start move file:${file.name}`);

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

    console.log(`check rules for file:${file.name}`);
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
            continue;
        }

        const existingFile = getAbstractFileFn(targetPath);
        if (existingFile instanceof TFile) {
            const errorMsg = `[Auto Note Mover] Error: A file with the same name "${fileFullName}" exists at the destination folder.`;
            console.error(errorMsg);
            continue;
        }

        try {
            await renameFileFn(file, targetPath);
            const successMsg = `[Auto Note Mover] Moved the note "${fileFullName}" to "${rule.targetFolder}".`;
            console.log(successMsg);
        } catch (error) {
            console.error(`[Auto Note Mover] Failed to move file: ${error}`);
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

    try {
        const result = await dataviewApi.tryQuery(query, this.app.workspace.getActiveFile()?.path);
        if (result.values.length > 1) {
            throw new Error("Only one element is expected as a result of the query execution.");
        }
        return result.values === 1;

    } catch (error) {
        console.error("Dataview query error:", error);
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

