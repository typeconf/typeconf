export enum WidgetType {
  Header = "Header",
  LineChart = "LineChart",
  Table = "Table",
  PieChart = "PieChart",
}

export type Widget = {
  name: string;
  query: string;
  widgetType: WidgetType;
  width: number;
  height: number;
};

export type Header = Widget & {
  name: string;
};

export type Dashboard = {
  name: string;
  widgets: Widget[];
};
