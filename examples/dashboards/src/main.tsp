enum WidgetType {
    Header,
    LineChart,
    Table,
    PieChart,
}

model Widget {
    name: string;
    query: string;
    widgetType: WidgetType,
    width: int32;
    height: int32;
};

model Header extends Widget {
    name: string;
}

model Dashboard {
  name: string;
  widgets: Array<Widget>;
}
