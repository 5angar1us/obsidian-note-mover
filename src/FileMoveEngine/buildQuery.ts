import { DataViewWhereExpression } from "../settings/settingsTypes";
import { NormalizedPath } from "../strongTypes/normalizePath";


export function buildMoveQuery(fullFilePath: NormalizedPath, whereExpression: DataViewWhereExpression): string {

    // Alternative WHERE file.path (with .extention)
    let query = `
    LIST
    FROM "${fullFilePath}"
    WHERE ${whereExpression}`;
    return query;
}