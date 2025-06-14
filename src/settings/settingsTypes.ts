export interface ExcludedFolder {
    path: string;
    withSubfolders: boolean
}

export interface SourceFolder {
    path: string;
    withSubfolders: boolean
}

export interface TargetFolder {
    path: string;
}

export interface Rule {
    sourceFolder: SourceFolder;
    targetFolder: TargetFolder;
    filter: DataViewWhereExpression;
}

export interface NoteMoverSettings {
    rules: Array<Rule>;
    excludedFolders: Array<ExcludedFolder>,
    trigger: Caller,
    isDebug: boolean

}
export type DataViewWhereExpression = string & { __brand: "data_view_where_expession" };

export type Caller = 'cmd' | 'auto';

export const FileExcludedFrontMatterEntryName = 'NoteMover'
export type FileExcludedFrontMatterEntry = 'disable' | "enable"
export function getTypedValue<T>(value: T): string {
    return String(value);
}