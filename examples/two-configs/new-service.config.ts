import { NewService } from "./types/all.js";
import oldService from "./old-service.config.js";

export const newService: NewService = {
    newAndShinyParam: "newparam",
    commonValues: oldService.commonValues,
};

export default newService;
