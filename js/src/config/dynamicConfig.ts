import {JWK} from "jwk-to-pem";

/**
 * Represents the configuration in the config.json file, which is processed by Octopus for each deployment
 * and environment.
 */
export interface DynamicConfig {
    settings: {
        basename: string,
        generateApiPath: string,
        title: string,
        editorFormat: string
        google: {
            tag: string
        },
        github: {
            enableLogin: boolean,
            loginPath: string
        },
        aws: {
            cognitoLogin: string;
            cognitoDeveloperGroup: string;
            jwk: {
                keys: JWK[]
            };
        }
    },
    useDefaultTheme?: boolean,
    generateTemplate: (url: string) => void,
    setCopyText: (copyText: string) => void,
    copyText?: string
}