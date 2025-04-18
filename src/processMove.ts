import { App, parseFrontMatterEntry, TAbstractFile, TFile } from "obsidian";

import { getAPI, DataviewApi } from "obsidian-dataview";
import { log } from "./logger/CompositeLogger";
import { Caller, ExcludedFolder, FileExcludedFrontMatterEntry, FileExcludedFrontMatterEntryName, getTypedValue, NoteMoverSettings, Rule, SourceFolder } from "./settings/settingsTypes";
import { NormalizedPath, normalizePath } from "./strongTypes/normalizePath";

export type FileCheckFn = (path: string) => TAbstractFile | null;
export type RenameFileFn = (file: TFile, newPath: string) => Promise<void>


export async function processMove(app: App, file: TFile, caller: Caller, settings: NoteMoverSettings, oldPath?: string,): Promise<boolean> {

    let isfileMoved = false;
    if (settings.trigger === "cmd" && caller === 'auto')
        return isfileMoved;

    log.logMessage(`id:${file.name} Start processing move of file`);

    const fileName = file.basename; // fileName
    const fileFullName = createFullName(file); // fileName.extention

    if (oldPath && !shouldProcessRename(fileFullName, oldPath)) {
        return isfileMoved;
    }

    if (isFileInExcludedFolder(file, settings.excludedFolders)) {
        return isfileMoved;
    }


    if (isFileExcluded(file, app)) {
        return isfileMoved;
    }

    const getAbstractFileFn: FileCheckFn = (path: NormalizedPath) => app.vault.getAbstractFileByPath(path);
    const renameFileFn: RenameFileFn = async (oldName, newName) => {
        // Avoid using vault.rename(), as it does not automatically update or rename links pointing to the renamed file.
        return app.fileManager.renameFile(oldName, newName);
    }
    const dataviewApi: DataviewApi = getAPI(app) as DataviewApi;

    log.logMessage(`id:${file.name} Rule check initiated`);

    for (const rule of settings.rules) {

        const currentPath = normalizePath(file.path);
        const targetPath = normalizePath(`${rule.targetFolder.path}/${fileFullName}`);

        const parentFolder = file.parent!; // The file will have the parent folder "/" at the root.

        if (!FileInSourceFolder(normalizePath(parentFolder.path), normalizePath(rule.sourceFolder.path), rule.sourceFolder.withSubfolders)) {
            continue;
        }

        const isFileFollowsRule = await FileFollowsRule(dataviewApi, rule, file)

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
            isfileMoved = true;
            await renameFileFn(file, targetPath);

            log.logMessage(`id:${file.name} Moved the note "${fileFullName}" to "${rule.targetFolder}".`)
        } catch (error) {
            log.logError(`id:${file.name} Failed to move file. Error: ${error}`);
        }
    }

    return isfileMoved;
}

function FileInSourceFolder(parentFolderPath: NormalizedPath, sourceFolderPath: NormalizedPath, withSubfolders: boolean) {

    if (withSubfolders) {
        return parentFolderPath === sourceFolderPath ||
            parentFolderPath.startsWith(sourceFolderPath)
    }

    return parentFolderPath === sourceFolderPath;
}

async function FileFollowsRule(dataviewApi: DataviewApi, rule: Rule, file: TFile) {

    const fullFilePath = normalizePath(file.path);
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


function AlreadyInTargetFolder(currentPath: string | NormalizedPath, targetPath: string | NormalizedPath) {
    return currentPath === targetPath;
}

function isFileInExcludedFolder(
    file: TFile,
    excludedFolders: ExcludedFolder[],
): boolean {
    if (!file.parent) return false;

    const parentFolderPath = normalizePath(file.parent.path);

    return excludedFolders.some(excluded => {
        if (!excluded.path) return false;

        const excludedFolderPath = normalizePath(excluded.path);

        if (excluded.withSubfolders) {
            return parentFolderPath === excludedFolderPath ||
                parentFolderPath.startsWith(excludedFolderPath);
        }

        return parentFolderPath === excludedFolderPath;
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

// Disable file movement when "NoteMover: disable" is present in the front matter.
function isFileExcluded(file: TFile, app: App) {

    const fileCache = this.app.metadataCache.getFileCache(file);
    const frontMatterEntry = parseFrontMatterEntry(fileCache.frontmatter, FileExcludedFrontMatterEntryName) as string;
    if (frontMatterEntry === getTypedValue<FileExcludedFrontMatterEntry>('disable')) {
        return true;
    } else {
        return false;
    }
}



