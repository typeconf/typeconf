import { Widget, WidgetType, Header, Dashboard } from "~/types/all.js";

// In this example we demonstrate that you can create a generated dashboard
// which can be created from resulting JSON. In real life you can probably describe full
// Grafana type system in Typespec and then import the resulting JSON.

const DEFAULT_WIDTH = 4;
const DEFAULT_HEIGHT = 3;

function make_rps_widget(handler: string): Widget {
    return {
        name: `${handler} rps`,
        query: `some prometheus query for ${handler}`,
        widgetType: WidgetType.LineChart,
        width: DEFAULT_WIDTH,
        height: DEFAULT_HEIGHT,
    }
}

function make_header(title: string): Header {
    return {
        name: title,
        query: "",
        widgetType: WidgetType.Header,
        width: DEFAULT_WIDTH,
        height: DEFAULT_HEIGHT,
    }
}

let config: Dashboard = {
    name: "Service dashboard",
    widgets: [
        make_header("RPS"),
        make_rps_widget("/api/main/hello"),
        make_rps_widget("/api/extra"),
        make_header("Other"),
    ]

};
export default config;
