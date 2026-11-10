// Type-level checks of `labels`, compiled by `tsc --noEmit` in the build (I18N-08): each props type takes its ptBR
// set and rejects a key the table does not have.
import type * as L from "../../src/index";
import { ptBR } from "../../src/locales/pt-BR";

export const TextFieldLabels: L.TextFieldProps = { label: "L", labels: ptBR.TextField };
// @ts-expect-error unknown label key
export const TextFieldUnknown: L.TextFieldProps = { label: "L", labels: { optional: "x" } };
export const AssertionLabels: L.AssertionProps = { expected: 1, actual: 1, labels: ptBR.Assertion };
// @ts-expect-error unknown label key
export const AssertionUnknown: L.AssertionProps = { expected: 1, actual: 1, labels: { skip: "x" } };
export const ErrorNoticeLabels: L.ErrorNoticeProps = { title: "E", labels: ptBR.ErrorNotice };
// @ts-expect-error unknown label key
export const ErrorNoticeUnknown: L.ErrorNoticeProps = { title: "E", labels: { warning: "x" } };
export const SectionTitleLabels: L.SectionTitleProps = { title: "T", labels: ptBR.SectionTitle };
// @ts-expect-error unknown label key
export const SectionTitleUnknown: L.SectionTitleProps = { title: "T", labels: { chapter: "x" } };
// @ts-expect-error a label is a string
export const TextFieldNotString: L.TextFieldProps = { label: "L", labels: { required: 1 } };
export const CheckLogLabels: L.CheckLogProps = { checks: [], labels: ptBR.CheckLog };
// @ts-expect-error unknown label key
export const CheckLogUnknown: L.CheckLogProps = { checks: [], labels: { error: "x" } };
export const StatusFlagLabels: L.StatusFlagProps = { status: "pass", labels: ptBR.StatusFlag };
// @ts-expect-error unknown label key
export const StatusFlagUnknown: L.StatusFlagProps = { status: "pass", labels: { title: "x" } };
export const ToleranceBarLabels: L.ToleranceBarProps = { label: "L", value: 1, labels: ptBR.ToleranceBar };
// @ts-expect-error unknown label key
export const ToleranceBarUnknown: L.ToleranceBarProps = { label: "L", value: 1, labels: { above: "x" } };
export const BarChartLabels: L.BarChartProps = { data: [], labels: ptBR.BarChart };
// @ts-expect-error unknown label key
export const BarChartUnknown: L.BarChartProps = { data: [], labels: { title: "x" } };
export const LineChartLabels: L.LineChartProps = { data: [], labels: ptBR.LineChart };
// @ts-expect-error unknown label key
export const LineChartUnknown: L.LineChartProps = { data: [], labels: { x: "x" } };
export const SchematicLabels: L.SchematicProps = { nodes: [], labels: ptBR.Schematic };
// @ts-expect-error unknown label key
export const SchematicUnknown: L.SchematicProps = { nodes: [], labels: { title: "x" } };
export const ProportionDialLabels: L.ProportionDialProps = { value: 1, labels: ptBR.ProportionDial };
// @ts-expect-error unknown label key
export const ProportionDialUnknown: L.ProportionDialProps = { value: 1, labels: { label: "x" } };
export const HierarchyLabels: L.HierarchyProps = { root: null, labels: ptBR.Hierarchy };
// @ts-expect-error unknown label key
export const HierarchyUnknown: L.HierarchyProps = { root: null, labels: { root: "x" } };
export const RedactedLabels: L.RedactedProps = { length: 2, labels: ptBR.Redacted };
// @ts-expect-error unknown label key
export const RedactedUnknown: L.RedactedProps = { length: 2, labels: { hidden: "x" } };
export const ReadoutLabels: L.ReadoutProps = { label: "L", value: "1", labels: ptBR.Readout };
// @ts-expect-error unknown label key
export const ReadoutUnknown: L.ReadoutProps = { label: "L", value: "1", labels: { same: "x" } };
export const StageIconLabels: L.StageIconProps = { stage: "A", labels: ptBR.StageIcon };
// @ts-expect-error unknown label key
export const StageIconUnknown: L.StageIconProps = { stage: "A", labels: { E: "x" } };
export const ContentsLabels: L.ContentsProps = { items: [], labels: ptBR.Contents };
// @ts-expect-error unknown label key
export const ContentsUnknown: L.ContentsProps = { items: [], labels: { title: "x" } };
export const CheckboxLabels: L.CheckboxProps = { label: "L", labels: ptBR.Checkbox };
// @ts-expect-error unknown label key
export const CheckboxUnknown: L.CheckboxProps = { label: "L", labels: { optional: "x" } };
export const SwitchLabels: L.SwitchProps = { label: "L", labels: ptBR.Switch };
// @ts-expect-error unknown label key
export const SwitchUnknown: L.SwitchProps = { label: "L", labels: { optional: "x" } };
export const RadioGroupLabels: L.RadioGroupProps = { label: "L", options: [], labels: ptBR.RadioGroup };
// @ts-expect-error unknown label key
export const RadioGroupUnknown: L.RadioGroupProps = { label: "L", options: [], labels: { optional: "x" } };
export const SelectLabels: L.SelectProps = { label: "L", options: [], labels: ptBR.Select };
// @ts-expect-error unknown label key
export const SelectUnknown: L.SelectProps = { label: "L", options: [], labels: { optional: "x" } };
export const DialogLabels: L.DialogProps = { open: false, onClose: () => {}, title: "T", labels: ptBR.Dialog };
// @ts-expect-error unknown label key
export const DialogUnknown: L.DialogProps = { open: false, onClose: () => {}, title: "T", labels: { title: "x" } };
export const PaginationLabels: L.PaginationProps = { page: 1, total: 2, labels: ptBR.Pagination };
// @ts-expect-error unknown label key
export const PaginationUnknown: L.PaginationProps = { page: 1, total: 2, labels: { title: "x" } };
export const SpinnerLabels: L.SpinnerProps = { labels: ptBR.Spinner };
// @ts-expect-error unknown label key
export const SpinnerUnknown: L.SpinnerProps = { labels: { title: "x" } };
export const ToasterLabels: L.ToasterProps = { labels: ptBR.Toaster };
// @ts-expect-error unknown label key
export const ToasterUnknown: L.ToasterProps = { labels: { title: "x" } };
