// Type-level checks of the shared component API, compiled by `tsc --noEmit` in the build; api.spec.tsx checks that
// every component of CASES_API has both lines. API-07: each props type accepts native attributes of its root.
// API-08: each props type rejects dangerouslySetInnerHTML.
import type { ReactElement } from "react";
import type * as L from "../../src/index";

const html = { __html: "" };
const click = () => {};

export const TagAccepts: L.TagProps = { children: "x", id: "a", "aria-describedby": "d", tabIndex: 0, onClick: click };
// @ts-expect-error dangerouslySetInnerHTML is not a prop
export const TagNoInnerHTML: L.TagProps = { children: "x", dangerouslySetInnerHTML: html };
export const StatusFlagAccepts: L.StatusFlagProps = { status: "pass", id: "a", "aria-live": "polite", onClick: click };
// @ts-expect-error dangerouslySetInnerHTML is not a prop
export const StatusFlagNoInnerHTML: L.StatusFlagProps = { status: "pass", dangerouslySetInnerHTML: html };
export const RedactedAccepts: L.RedactedProps = { length: 4, role: "presentation", style: { color: "red" } };
// @ts-expect-error dangerouslySetInnerHTML is not a prop
export const RedactedNoInnerHTML: L.RedactedProps = { length: 4, dangerouslySetInnerHTML: html };
export const AssertionAccepts: L.AssertionProps = { expected: 1, actual: 1, id: "a", role: "group", onClick: click };
// @ts-expect-error dangerouslySetInnerHTML is not a prop
export const AssertionNoInnerHTML: L.AssertionProps = { expected: 1, actual: 1, dangerouslySetInnerHTML: html };
export const BarChartAccepts: L.BarChartProps = { data: [], "aria-label": "Sales", onClick: click };
// @ts-expect-error dangerouslySetInnerHTML is not a prop
export const BarChartNoInnerHTML: L.BarChartProps = { data: [], dangerouslySetInnerHTML: html };
export const CheckLogAccepts: L.CheckLogProps = { checks: [], id: "a", "aria-describedby": "d", onClick: click };
// @ts-expect-error dangerouslySetInnerHTML is not a prop
export const CheckLogNoInnerHTML: L.CheckLogProps = { checks: [], dangerouslySetInnerHTML: html };
export const MeterAccepts: L.MeterProps = { label: "M", value: 1, id: "a", style: { marginTop: 4 }, onClick: click };
// @ts-expect-error dangerouslySetInnerHTML is not a prop
export const MeterNoInnerHTML: L.MeterProps = { label: "M", value: 1, dangerouslySetInnerHTML: html };
export const ReadoutAccepts: L.ReadoutProps = { label: "R", value: 1, id: "a", "aria-live": "polite", onClick: click };
// @ts-expect-error dangerouslySetInnerHTML is not a prop
export const ReadoutNoInnerHTML: L.ReadoutProps = { label: "R", value: 1, dangerouslySetInnerHTML: html };
export const ToleranceBarAccepts: L.ToleranceBarProps = { label: "T", value: 1, id: "a", tabIndex: 0, onClick: click };
// @ts-expect-error dangerouslySetInnerHTML is not a prop
export const ToleranceBarNoInnerHTML: L.ToleranceBarProps = { label: "T", value: 1, dangerouslySetInnerHTML: html };
export const TranscriptAccepts: L.TranscriptProps = { lines: [], id: "a", "aria-describedby": "d", onClick: click };
// @ts-expect-error dangerouslySetInnerHTML is not a prop
export const TranscriptNoInnerHTML: L.TranscriptProps = { lines: [], dangerouslySetInnerHTML: html };
export const HierarchyAccepts: L.HierarchyProps = { root: null, id: "a", role: "tree", onClick: click };
// @ts-expect-error dangerouslySetInnerHTML is not a prop
export const HierarchyNoInnerHTML: L.HierarchyProps = { root: null, dangerouslySetInnerHTML: html };
export const ContentsAccepts: L.ContentsProps = { items: [], id: "a", start: 2, "aria-label": "Toc", onClick: click };
// @ts-expect-error dangerouslySetInnerHTML is not a prop
export const ContentsNoInnerHTML: L.ContentsProps = { items: [], dangerouslySetInnerHTML: html };
export const FootnotesAccepts: L.FootnotesProps = { notes: [], id: "a", reversed: true, onClick: click };
// @ts-expect-error dangerouslySetInnerHTML is not a prop
export const FootnotesNoInnerHTML: L.FootnotesProps = { notes: [], dangerouslySetInnerHTML: html };
export const TimelineAccepts: L.TimelineProps = { events: [], id: "a", start: 1, onClick: click };
// @ts-expect-error dangerouslySetInnerHTML is not a prop
export const TimelineNoInnerHTML: L.TimelineProps = { events: [], dangerouslySetInnerHTML: html };
export const FieldListAccepts: L.FieldListProps = { fields: [], id: "a", "aria-describedby": "d", onClick: click };
// @ts-expect-error dangerouslySetInnerHTML is not a prop
export const FieldListNoInnerHTML: L.FieldListProps = { fields: [], dangerouslySetInnerHTML: html };
export const DataTableAccepts: L.DataTableProps = { columns: [], rows: [], id: "a", summary: "s", onClick: click };
// @ts-expect-error dangerouslySetInnerHTML is not a prop
export const DataTableNoInnerHTML: L.DataTableProps = { columns: [], rows: [], dangerouslySetInnerHTML: html };
export const QuoteAccepts: L.QuoteProps = { children: "Q", id: "a", "aria-describedby": "d", onClick: click };
// @ts-expect-error dangerouslySetInnerHTML is not a prop
export const QuoteNoInnerHTML: L.QuoteProps = { children: "Q", dangerouslySetInnerHTML: html };
export const ConnectorAccepts: L.ConnectorProps = { id: "a", role: "img", "aria-label": "Arrow", onClick: click };
// @ts-expect-error dangerouslySetInnerHTML is not a prop
export const ConnectorNoInnerHTML: L.ConnectorProps = { dangerouslySetInnerHTML: html };
export const DimensionAccepts: L.DimensionProps = { id: "a", "aria-describedby": "d", tabIndex: 0, onClick: click };
// @ts-expect-error dangerouslySetInnerHTML is not a prop
export const DimensionNoInnerHTML: L.DimensionProps = { dangerouslySetInnerHTML: html };
export const LineChartAccepts: L.LineChartProps = { data: [], id: "a", preserveAspectRatio: "none", onClick: click };
// @ts-expect-error dangerouslySetInnerHTML is not a prop
export const LineChartNoInnerHTML: L.LineChartProps = { data: [], dangerouslySetInnerHTML: html };
export const SchematicAccepts: L.SchematicProps = { id: "a", style: { marginTop: 4 }, onClick: click };
// @ts-expect-error dangerouslySetInnerHTML is not a prop
export const SchematicNoInnerHTML: L.SchematicProps = { dangerouslySetInnerHTML: html };
export const ProportionDialAccepts: L.ProportionDialProps = { value: 1, id: "a", focusable: false, onClick: click };
// @ts-expect-error dangerouslySetInnerHTML is not a prop
export const ProportionDialNoInnerHTML: L.ProportionDialProps = { value: 1, dangerouslySetInnerHTML: html };
export const StageIconAccepts: L.StageIconProps = { stage: "A", id: "a", "aria-describedby": "d", onClick: click };
// @ts-expect-error dangerouslySetInnerHTML is not a prop
export const StageIconNoInnerHTML: L.StageIconProps = { stage: "A", dangerouslySetInnerHTML: html };
export const SectionTitleAccepts: L.SectionTitleProps = {
  title: "S",
  level: 3,
  id: "a",
  "aria-describedby": "d",
  onClick: click,
};
// @ts-expect-error dangerouslySetInnerHTML is not a prop
export const SectionTitleNoInnerHTML: L.SectionTitleProps = { title: "S", dangerouslySetInnerHTML: html };
export const DataHeaderAccepts: L.DataHeaderProps = { title: "D", level: 2, id: "a", role: "banner", onClick: click };
// @ts-expect-error dangerouslySetInnerHTML is not a prop
export const DataHeaderNoInnerHTML: L.DataHeaderProps = { title: "D", dangerouslySetInnerHTML: html };
export const ComparisonAccepts: L.ComparisonProps = {
  columns: [],
  level: 4,
  id: "a",
  style: { gap: 4 },
  onClick: click,
};
// @ts-expect-error dangerouslySetInnerHTML is not a prop
export const ComparisonNoInnerHTML: L.ComparisonProps = { columns: [], dangerouslySetInnerHTML: html };
export const ErrorNoticeAccepts: L.ErrorNoticeProps = { title: "E", level: 2, id: "a", role: "alert", onClick: click };
// @ts-expect-error dangerouslySetInnerHTML is not a prop
export const ErrorNoticeNoInnerHTML: L.ErrorNoticeProps = { title: "E", dangerouslySetInnerHTML: html };
export const TextFieldAccepts: L.TextFieldProps = { label: "L", autoComplete: "email", maxLength: 20, onBlur: click };
// @ts-expect-error dangerouslySetInnerHTML is not a prop
export const TextFieldNoInnerHTML: L.TextFieldProps = { label: "L", dangerouslySetInnerHTML: html };

export const ButtonAccepts: L.ButtonProps = { children: "x", id: "a", type: "submit", disabled: true, onClick: click };
// @ts-expect-error dangerouslySetInnerHTML is not a prop
export const ButtonNoInnerHTML: L.ButtonProps = { children: "x", dangerouslySetInnerHTML: html };
export const IconButtonAccepts: L.IconButtonProps = {
  label: "Fechar",
  id: "a",
  "aria-describedby": "d",
  onClick: click,
};
// BTN-12: the props type requires `label`, a string.
// @ts-expect-error label is required
export const IconButtonNoLabel: L.IconButtonProps = { children: "x" };
// @ts-expect-error label is a string
export const IconButtonLabelNotString: L.IconButtonProps = { label: 1 };
// @ts-expect-error dangerouslySetInnerHTML is not a prop
export const IconButtonNoInnerHTML: L.IconButtonProps = { label: "x", dangerouslySetInnerHTML: html };
export const LinkAccepts: L.LinkProps = { href: "/x", target: "_blank", rel: "noreferrer", id: "a", onClick: click };
// @ts-expect-error dangerouslySetInnerHTML is not a prop
export const LinkNoInnerHTML: L.LinkProps = { href: "/x", dangerouslySetInnerHTML: html };
export const CheckboxAccepts: L.CheckboxProps = { label: "L", name: "n", defaultChecked: true, onChange: click };
// @ts-expect-error dangerouslySetInnerHTML is not a prop
export const CheckboxNoInnerHTML: L.CheckboxProps = { label: "L", dangerouslySetInnerHTML: html };
export const SwitchAccepts: L.SwitchProps = { label: "L", name: "n", checked: true, onChange: click };
// @ts-expect-error dangerouslySetInnerHTML is not a prop
export const SwitchNoInnerHTML: L.SwitchProps = { label: "L", dangerouslySetInnerHTML: html };
export const RadioGroupAccepts: L.RadioGroupProps = {
  label: "L",
  options: [],
  id: "a",
  disabled: true,
  onClick: click,
};
// @ts-expect-error dangerouslySetInnerHTML is not a prop
export const RadioGroupNoInnerHTML: L.RadioGroupProps = { label: "L", options: [], dangerouslySetInnerHTML: html };
export const SelectAccepts: L.SelectProps = { label: "L", options: [], name: "n", defaultValue: "a", onChange: click };
// @ts-expect-error dangerouslySetInnerHTML is not a prop
export const SelectNoInnerHTML: L.SelectProps = { label: "L", options: [], dangerouslySetInnerHTML: html };
// TIP-08: the tip is text only.
const element = {} as ReactElement;
export const TooltipText: L.TooltipProps = { content: "Copiar", children: element };
// @ts-expect-error content is a string, not an element
export const TooltipNoElement: L.TooltipProps = { content: element, children: element };

const dialog = { open: true, onClose: click, title: "T" };
export const DialogAccepts: L.DialogProps = {
  ...dialog,
  id: "a",
  "aria-describedby": "d",
  onClick: click,
};
// @ts-expect-error dangerouslySetInnerHTML is not a prop
export const DialogNoInnerHTML: L.DialogProps = { ...dialog, dangerouslySetInnerHTML: html };
export const PopoverAccepts: L.PopoverProps = {
  trigger: element,
  id: "a",
  "aria-describedby": "d",
  tabIndex: 0,
  onClick: click,
};
// @ts-expect-error dangerouslySetInnerHTML is not a prop
export const PopoverNoInnerHTML: L.PopoverProps = { trigger: element, dangerouslySetInnerHTML: html };
export const TooltipAccepts: L.TooltipProps = { content: "Copiar", children: element, id: "a", onClick: click };
// @ts-expect-error dangerouslySetInnerHTML is not a prop
export const TooltipNoInnerHTML: L.TooltipProps = { content: "x", children: element, dangerouslySetInnerHTML: html };
export const MenuAccepts: L.MenuProps = {
  trigger: element,
  items: [],
  id: "a",
  "aria-describedby": "d",
  onClick: click,
};
// @ts-expect-error dangerouslySetInnerHTML is not a prop
export const MenuNoInnerHTML: L.MenuProps = { trigger: element, items: [], dangerouslySetInnerHTML: html };

export const TabsAccepts: L.TabsProps = {
  tabs: [],
  id: "a",
  "aria-describedby": "d",
  style: { marginTop: 4 },
  onClick: click,
};
// @ts-expect-error dangerouslySetInnerHTML is not a prop
export const TabsNoInnerHTML: L.TabsProps = { tabs: [], dangerouslySetInnerHTML: html };
export const AccordionAccepts: L.AccordionProps = { items: [], id: "a", "aria-describedby": "d", onClick: click };
// @ts-expect-error dangerouslySetInnerHTML is not a prop
export const AccordionNoInnerHTML: L.AccordionProps = { items: [], dangerouslySetInnerHTML: html };
export const PaginationAccepts: L.PaginationProps = {
  page: 1,
  total: 2,
  id: "a",
  "aria-describedby": "d",
  onClick: click,
};
// @ts-expect-error dangerouslySetInnerHTML is not a prop
export const PaginationNoInnerHTML: L.PaginationProps = { page: 1, total: 2, dangerouslySetInnerHTML: html };

export const IconAccepts: L.IconProps = { name: "check", id: "a", "aria-describedby": "d", onClick: click };
// @ts-expect-error dangerouslySetInnerHTML is not a prop
export const IconNoInnerHTML: L.IconProps = { name: "check", dangerouslySetInnerHTML: html };
export const SpinnerAccepts: L.SpinnerProps = {
  id: "a",
  "aria-describedby": "d",
  style: { marginTop: 4 },
  onClick: click,
};
// @ts-expect-error dangerouslySetInnerHTML is not a prop
export const SpinnerNoInnerHTML: L.SpinnerProps = { dangerouslySetInnerHTML: html };
export const SkeletonAccepts: L.SkeletonProps = {
  id: "a",
  "aria-describedby": "d",
  style: { marginTop: 4 },
  onClick: click,
};
// @ts-expect-error dangerouslySetInnerHTML is not a prop
export const SkeletonNoInnerHTML: L.SkeletonProps = { dangerouslySetInnerHTML: html };
export const StackAccepts: L.StackProps = { id: "a", "aria-describedby": "d", role: "list", onClick: click };
// @ts-expect-error dangerouslySetInnerHTML is not a prop
export const StackNoInnerHTML: L.StackProps = { dangerouslySetInnerHTML: html };
export const GridAccepts: L.GridProps = { columns: 2, id: "a", "aria-describedby": "d", onClick: click };
// @ts-expect-error dangerouslySetInnerHTML is not a prop
export const GridNoInnerHTML: L.GridProps = { columns: 2, dangerouslySetInnerHTML: html };
export const DividerAccepts: L.DividerProps = { id: "a", "aria-describedby": "d", onClick: click };
// @ts-expect-error dangerouslySetInnerHTML is not a prop
export const DividerNoInnerHTML: L.DividerProps = { dangerouslySetInnerHTML: html };
export const ToasterAccepts: L.ToasterProps = {
  id: "a",
  "aria-describedby": "d",
  style: { zIndex: 2 },
  onClick: click,
};
// @ts-expect-error dangerouslySetInnerHTML is not a prop
export const ToasterNoInnerHTML: L.ToasterProps = { dangerouslySetInnerHTML: html };
