import { App, normalizePath, TAbstractFile, TFile, TFolder, Vault } from "obsidian";
import { AutoNoteMoverSettings, ExcludedFolder } from "./settings";
import { getAPI, DataviewApi } from "obsidian-dataview";

export type FileCheckFn = (path: string) => TAbstractFile | null;
export type RenameFileFn = (file: TFile, newPath: string) => Promise<void>
export type Caller = 'cmd' | 'auto';


export async function handleFiles(app: App, file: TAbstractFile, сaller: Caller, excludedFolder: ExcludedFolder[], useRegexForExcludedFolders: boolean, oldPath?: string,){
    //TODO добавить в настройки триггер
    //TODO проверка this.settings.trigger_auto_manual !== 'Automatic' && caller !== 'cmd'
   
    if (!(file instanceof TFile)) return;

    const fileName = file.basename;
    const fileFullName = createFullName(file);

    if (oldPath && !shouldProcessRename(fileFullName, oldPath)) {
        return;
    }

    if (isFileInExcludedFolder(file, excludedFolder, useRegexForExcludedFolders)) {
        return;
    }

    //TODO get file path from rules
    const settingFolder: string = "Target Folder"

    // Normalize paths once at the start
    const targetPath = normalizePath(`${settingFolder}/${fileFullName}`);
    const currentPath = normalizePath(file.path);
    
    const rule = `
    LIST
    FROM "${currentPath}"
    WHERE fileClass = "External"`; // TODO заменить where

    const dataviewApi: DataviewApi = getAPI(app) as DataviewApi;

    const isFileFollowsRule = FileFollowsRule(dataviewApi, rule)
    if(!isFileFollowsRule)
        return false;
    


    const getAbstractFileFn: FileCheckFn = (path: string) => app.vault.getAbstractFileByPath(normalizePath(path))
    const renameFileFn: RenameFileFn = async (oldName, newName) => app.fileManager.renameFile(oldName, newName);

    if (AlreadyInTargetFolder(currentPath, targetPath)) {
        return;
    }

    // Check for existing file at destination
    const existingFile = getAbstractFileFn(targetPath);
    if (existingFile instanceof TFile) {
        const errorMsg = `[Auto Note Mover] Error: A file with the same name "${fileFullName}" exists at the destination folder.`;
        console.error(errorMsg);
        return;
    }

    try {
        await renameFileFn(file, targetPath);
        const successMsg = `[Auto Note Mover] Moved the note "${fileFullName}" to "${settingFolder}".`;
        console.log(successMsg);
    } catch (error) {
        console.error(`[Auto Note Mover] Failed to move file: ${error}`);
    }

}


async function FileFollowsRule(dataviewApi: DataviewApi, rule:string){

    const query = rule;

    try {
        // Выполняем запрос [[3]][[7]]
        const result = await dataviewApi.tryQuery(query, this.app.workspace.getActiveFile()?.path);
        
        // Обрабатываем результат для LIST-запроса [[10]]
        if (result.type === 'list') {
            //@ts-ignore
            result.values.forEach(item => {
                //@ts-ignore
                console.log("Found item:", item.value);
                // Здесь можно добавить отображение элементов в интерфейсе
            });
            if(result.value.length() !== 1)
                throw new Error("Problem with query in dataviewApi");

            return true
        }
    } catch (error) {
        console.error("Dataview query error:", error);
        throw error;
    }

    return false;
}

function AlreadyInTargetFolder(currentPath:string, targetPath:string,){
    return currentPath === targetPath;
}

function isFileInExcludedFolder(
    file: TFile,
    excludedFolders: ExcludedFolder[],
    useRegexForExcludedFolders: boolean
): boolean {
    return excludedFolders.some(excluded => {
        if (!excluded.folder) return false;
        if (!file.parent) return false; //TODO проверить что работает.
        
        const folderPath = file.parent.path;
        const excludedPath = excluded.folder;
        
        if (useRegexForExcludedFolders) {
            try {
                const regex = new RegExp(excludedPath);
                return regex.test(folderPath);
            } catch (e) {
                console.error(`Invalid regex pattern: ${excludedPath}`, e);
                return false;
            }
        }
        
        return normalizePath(excludedPath) === folderPath;
    });
}

function shouldProcessRename(newFilename:string, oldPath?: string) {
    if (!oldPath) return false;
    
    const oldFilename = oldPath.split('/').pop();

    return oldFilename !== newFilename;
}

function createFullName(file: TFile){
    return `${file.basename}.${file.extension}`
}

