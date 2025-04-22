export type CssSelector = string & { __brand: "css_selector" };

function CreateCssSelector(cssSelectorName: string): CssSelector {
    return cssSelectorName as CssSelector;
}

export const nmDatawiewWhereExpession__input: CssSelector = CreateCssSelector("nm-dataview-where-expression__input");
export const nmSearch__input: CssSelector = CreateCssSelector("nm-search__input");
export const nmQueryPreformatted: CssSelector = CreateCssSelector("nm-query-preformatted");
export const nm_filter_status: CssSelector = CreateCssSelector("nm-filter__status");
export const nm_rule_filter: CssSelector = CreateCssSelector("nm-rule-filter");
export const nmError__Details: CssSelector = CreateCssSelector("nm-error__details");
export const nmError__Pre: CssSelector = CreateCssSelector("nm-error__pre");

