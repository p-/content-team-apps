import {FC, ReactElement, useContext, useEffect, useState} from "react";
import {getJsonApi, isBranchingEnabled} from "../utils/network";
import {AppContext} from "../App";
import {AuditsCollection} from "./Audits";
import {JSEncrypt} from "jsencrypt";
import {Chart, ChartConfiguration, registerables} from "chart.js";
import {chartColors} from "../utils/charts";

Chart.register(...registerables);

const Reports: FC<{}> = (): ReactElement => {
    const context = useContext(AppContext);
    const [emailAuditsFourWeeks, setEmailAuditsFourWeeks] = useState<AuditsCollection | null>(null);
    const [emailAuditsOneWeek, setEmailAuditsOneWeek] = useState<AuditsCollection | null>(null);
    const [templateAuditsFourWeeks, setTemplateAuditsFourWeeks] = useState<AuditsCollection | null>(null);
    const [templateAuditsOneWeek, setTemplateAuditsOneWeek] = useState<AuditsCollection | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [privateKey, setPrivateKey] = useState<string | null>(null);

    useEffect(() => {
        const decrypt = (email: string): string => {
            if (!privateKey) {
                return email;
            }

            try {
                const decrypt = new JSEncrypt();
                decrypt.setPrivateKey(privateKey);
                return decrypt.decrypt(email).toString();
            } catch {
                // If the wrong key is used, fail silently
                return email;
            }
        }

        const processAudits = (audits: AuditsCollection): AuditsCollection => {
            return {
                ...audits, data: audits.data
                    ?.map(a => {
                        a.attributes.object = decrypt(a.attributes.object);
                        return a;
                    })
                    ?.filter(a => !a.attributes.object.endsWith("users.noreply.github.com"))
            }
        }

        const fourWeeksAgo = new Date(new Date().getTime() - (28 * 24 * 60 * 60 * 1000));
        const oneWeekAgo = new Date(new Date().getTime() - (7 * 24 * 60 * 60 * 1000));

        getJsonApi<AuditsCollection>(context.settings.auditEndpoint + "?page[limit]=10000&page[offset]=0&filter=action==CreateTemplateFor%3Btime>=" + fourWeeksAgo.toISOString(), "main")
            .then(data => {
                setEmailAuditsFourWeeks(processAudits(data));
                setEmailAuditsOneWeek(processAudits({...data, data: data.data?.filter(a => a.attributes.time >= oneWeekAgo.getTime())}));
            })
            .catch(err => {
                setError("Failed to retrieve audit resources. Make sure you are logged in. "
                    + (isBranchingEnabled() ? "Branching rules are enabled - double check they are valid, or disable them." : ""));
                console.log(err);
            })
    }, [setEmailAuditsFourWeeks, setEmailAuditsOneWeek, context.settings.auditEndpoint, privateKey]);

    useEffect(() => {
        const fourWeeksAgo = new Date(new Date().getTime() - (28 * 24 * 60 * 60 * 1000));
        const oneWeekAgo = new Date(new Date().getTime() - (7 * 24 * 60 * 60 * 1000));

        const buildLanguageReport = (audits: AuditsCollection) => {
            const data = {
                labels: ['Java', '.NET Core', 'Node.js', 'Go', 'Python', 'PHP', 'Ruby'],
                datasets: [
                    {
                        data: [
                            // Ignore gradle as it is the default template returned, which skews the results
                            audits?.data?.filter(a => a.attributes.object === "Java Maven").length,
                            audits?.data?.filter(a => a.attributes.object === "DotNET Core").length,
                            audits?.data?.filter(a => a.attributes.object === "Node.js").length,
                            audits?.data?.filter(a => a.attributes.object === "Go").length,
                            audits?.data?.filter(a => a.attributes.object === "Python").length,
                            audits?.data?.filter(a => a.attributes.object === "PHP").length,
                            audits?.data?.filter(a => a.attributes.object === "Ruby").length
                        ],
                        backgroundColor: chartColors
                    }
                ]
            };

            const config: ChartConfiguration = {
                type: 'pie',
                data: data,
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'top',
                        },
                        title: {
                            display: true,
                            text: 'Language Report (28 days)'
                        }
                    }
                },
            };

            const languageReport = document.getElementById('languageReport') as HTMLCanvasElement;
            if (languageReport) {
                new Chart(languageReport, config);
            }
        }
        const buildPlatformReport = (audits: AuditsCollection) => {
            const data = {
                labels: ['Jenkins', 'GitHub Actions'],
                datasets: [
                    {
                        data: [
                            audits?.data?.filter(a => a.attributes.subject === "JenkinsPipelineBuilder").length,
                            audits?.data?.filter(a => a.attributes.subject === "GithubActionWorkflowBuilder").length
                        ],
                        backgroundColor: chartColors
                    }
                ]
            };

            const config: ChartConfiguration = {
                type: 'pie',
                data: data,
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'top',
                        },
                        title: {
                            display: true,
                            text: 'Platform Report (28 days)'
                        }
                    }
                },
            };

            const languageReport = document.getElementById('platformReport') as HTMLCanvasElement;
            if (languageReport) {
                new Chart(languageReport, config);
            }
        }

        getJsonApi<AuditsCollection>(context.settings.auditEndpoint + "?page[limit]=10000&page[offset]=0&filter=action==CreateTemplateUsing%3Btime>=" + fourWeeksAgo.toISOString(), "main")
            .then(data => {
                setTemplateAuditsFourWeeks(data);
                setTemplateAuditsOneWeek({...data, data: data.data?.filter(a => a.attributes.time >= oneWeekAgo.getTime())});
                buildLanguageReport(data);
                buildPlatformReport(data);
            })
            .catch(err => {
                setError("Failed to retrieve audit resources. Make sure you are logged in. "
                    + (isBranchingEnabled() ? "Branching rules are enabled - double check they are valid, or disable them." : ""));
                console.log(err);
            })
    }, [setEmailAuditsFourWeeks, setTemplateAuditsOneWeek, context.settings.auditEndpoint, privateKey]);

    return <div>
        {error && <span>{error}</span>}
        <p>Note some of these email addresses are unusable "no-reply" addresses. Upload the private key using the button below to allow the report to filter
            no-reply email addresses.</p>
        <form encType="multipart/form-data">
            <input id="upload" type="file" accept=".pem" name="files[]" size={30} onChange={(evt) => {
                const files = evt.target.files || [];
                const f = files[0];
                const reader = new FileReader();

                // Closure to capture the file information.
                reader.onload = function (e) {
                    setPrivateKey(e.target?.result?.toString() || null);
                };

                reader.readAsText(f);
            }}/>
        </form>
        <table>
            <tr>
                <td style={{padding: "32px"}}>
                    <h1>Last 28 Days</h1>
                    <p>Emails collected: {emailAuditsFourWeeks?.data?.length}</p>
                    <p>Jenkins templates: {templateAuditsFourWeeks?.data?.filter(a => a.attributes.subject === "JenkinsPipelineBuilder").length}</p>
                    <p>GitHub Actions templates: {templateAuditsFourWeeks?.data?.filter(a => a.attributes.subject === "GithubActionWorkflowBuilder").length}</p>
                    <p>Node.js templates: {templateAuditsFourWeeks?.data?.filter(a => a.attributes.object === "Node.js").length}</p>
                    <p>DotNET Core templates: {templateAuditsFourWeeks?.data?.filter(a => a.attributes.object === "DotNET Core").length}</p>
                    <p>Generic templates: {templateAuditsFourWeeks?.data?.filter(a => a.attributes.object === "Generic").length}</p>
                    <p>Go templates: {templateAuditsFourWeeks?.data?.filter(a => a.attributes.object === "Go").length}</p>
                    <p>Java Gradle templates: {templateAuditsFourWeeks?.data?.filter(a => a.attributes.object === "Java Gradle").length}</p>
                    <p>Java Maven templates: {templateAuditsFourWeeks?.data?.filter(a => a.attributes.object === "Java Maven").length}</p>
                    <p>PHP templates: {templateAuditsFourWeeks?.data?.filter(a => a.attributes.object === "PHP").length}</p>
                    <p>Python templates: {templateAuditsFourWeeks?.data?.filter(a => a.attributes.object === "Python").length}</p>
                    <p>Ruby templates: {templateAuditsFourWeeks?.data?.filter(a => a.attributes.object === "Ruby").length}</p>
                </td>
                <td style={{padding: "32px"}}>
                    <h1>Last 7 Days</h1>
                    <p>Emails collected: {emailAuditsOneWeek?.data?.length}</p>
                    <p>Jenkins templates: {templateAuditsOneWeek?.data?.filter(a => a.attributes.subject === "JenkinsPipelineBuilder").length}</p>
                    <p>GitHub Actions templates: {templateAuditsOneWeek?.data?.filter(a => a.attributes.subject === "GithubActionWorkflowBuilder").length}</p>
                    <p>Node.js templates: {templateAuditsOneWeek?.data?.filter(a => a.attributes.object === "Node.js").length}</p>
                    <p>DotNET Core templates: {templateAuditsOneWeek?.data?.filter(a => a.attributes.object === "DotNET Core").length}</p>
                    <p>Generic templates: {templateAuditsOneWeek?.data?.filter(a => a.attributes.object === "Generic").length}</p>
                    <p>Go templates: {templateAuditsOneWeek?.data?.filter(a => a.attributes.object === "Go").length}</p>
                    <p>Java Gradle templates: {templateAuditsOneWeek?.data?.filter(a => a.attributes.object === "Java Gradle").length}</p>
                    <p>Java Maven templates: {templateAuditsOneWeek?.data?.filter(a => a.attributes.object === "Java Maven").length}</p>
                    <p>PHP templates: {templateAuditsOneWeek?.data?.filter(a => a.attributes.object === "PHP").length}</p>
                    <p>Python templates: {templateAuditsOneWeek?.data?.filter(a => a.attributes.object === "Python").length}</p>
                    <p>Ruby templates: {templateAuditsOneWeek?.data?.filter(a => a.attributes.object === "Ruby").length}</p>
                </td>
                <td style={{padding: "32px"}}>
                    <canvas id="languageReport"></canvas>
                </td>
                <td style={{padding: "32px"}}>
                    <canvas id="platformReport"></canvas>
                </td>
            </tr>
        </table>
    </div>
}

export default Reports;