export type CssSelector = string & { __brand: "css_selector" };

function CreateCssSelector(cssSelectorName: string): CssSelector {
    return cssSelectorName as CssSelector;
}

export const nmDatawiewWhereExpession__input: CssSelector = CreateCssSelector("nm-dataview-where-expression__input") ;
export const nmSearch__input: CssSelector = CreateCssSelector("nm-search__input") ;
export const query_preformatted: CssSelector = CreateCssSelector("query-preformatted");
export const nm_filter_status: CssSelector = CreateCssSelector("nm-filter__status") ;
export const nm_rule_filter: CssSelector = CreateCssSelector("nm-rule-filter");

