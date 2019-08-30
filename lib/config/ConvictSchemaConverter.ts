import * as convict from "convict";

function convert<T>(convict: convict.Config<T>, {}: convict.Schema<T> | string): T {
    return convict.getProperties();
}

export default convert;
