import { z } from "zod";
export enum WidgetTypeEnum {
  Header = "Header",
  LineChart = "LineChart",
  Table = "Table",
  PieChart = "PieChart",
}

export const WidgetSchema = z.object({
  name: z.string(),
  query: z.string(),
  widgetType: z.nativeEnum(WidgetTypeEnum),
  width: z.number(),
  height: z.number(),
});

export const HeaderSchema = z.object({
  name: z.string(),
});

export const DashboardSchema = z.object({
  name: z.string(),
  widgets: z.array(WidgetSchema),
});

const TYPECONF_SCHEMAS_MAP = {
  "/home/ivan/root/data/dev/typeconf/examples/dashboards/src/values.config.ts":
    DashboardSchema,
};

export default TYPECONF_SCHEMAS_MAP;
