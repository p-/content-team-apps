import {FC, ReactElement, useContext, useEffect, useState} from "react";
import {Button, CircularProgress, Grid} from "@mui/material";
import {journeyContainer, openResourceStyle, progressStyle, styles} from "../../utils/styles";
import {JourneyProps} from "../../statemachine/appBuilder";
import LinearProgress from "@mui/material/LinearProgress";
import {getJsonApi} from "../../utils/network";
import {AppContext} from "../../App";
import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined';

const Done: FC<JourneyProps> = (props): ReactElement => {
    const classes = journeyContainer();
    const moreClasses = styles();

    const context = useContext(AppContext);
    const [repoCreated, setRepoCreated] = useState<boolean>(false);
    const [workflowCompleted] = useState<boolean>(false);
    const [spaceCreated] = useState<boolean>(false);

    const checkRepoExists = () => {
        getJsonApi(context.settings.githubRepoEndpoint + "/" + encodeURI(props.machine.state.context.apiRepoUrl), context.settings, null)
            .then(body => {
                const bodyObject = body as any;
                if (bodyObject.data.id) {
                    setRepoCreated(true);
                }
            })
            .catch(() => {
                setRepoCreated(false);
            });
    }

    useEffect(() => {
        const timer = setInterval(() => {
            if (!context.settings.disableExternalCalls) {
                checkRepoExists();
            } else {
                // show a mock change after 1 second
                setRepoCreated(true);
            }
        }, 1000);
        return () => clearInterval(timer);
    });

    // Make sure people don't exit away unexpectedly
    window.addEventListener("beforeunload", (ev) => {
        ev.preventDefault();
        return ev.returnValue = 'Are you sure you want to close? This page has important information regarding the new resources being created by the App Builder.';
    });

    function getOctopusServer() {
        if (props.machine.state.context.octopusServer) {
            try {
                const url = new URL(props.machine.state.context.octopusServer);
                return "https://" + url.hostname;
            } catch {
                return "https://" + props.machine.state.context.octopusServer.split("/")[0];
            }
        }
        // Let the service return an error in its response code, and handle the response as usual.
        return "";
    }

    return (
        <>
            <Grid
                container={true}
                className={classes.root}
                spacing={2}
            >
                <Grid item md={3} xs={0}/>
                <Grid item md={6} xs={12}>
                    <Grid
                        container={true}
                        className={classes.column}
                    >
                        <LinearProgress variant="determinate" value={100} sx={progressStyle}/>
                        <h2>You're all done.</h2>
                        <p>
                            In the background a GitHub repository is being populated with a sample application and
                            Terraform templates.
                        </p>
                        <p>
                            The application code and Terraform templates are processed by
                            a GitHub Actions workflow. The code is compiled into deployable artifacts (ZIP files or
                            Docker images depending on the platform), while the Terraform templates are used to create
                            and populate a new Octopus space. This is the CI half of the CI/CD pipeline.
                        </p>
                        <p>
                            Once the Octopus space is populated, the projects it contains are used to deploy the sample
                            application to the cloud. This is the CD half of the CI/CD pipeline.
                        </p>
                        <p>
                            The progress of the various resources that are created by the App Builder is shown below:
                        </p>
                        <table>
                            <tr>
                                <td>{repoCreated && <CheckCircleOutlineOutlinedIcon className={moreClasses.icon}/>}
                                    {!repoCreated && <CircularProgress size={32}/>}</td>
                                <td>{repoCreated && <span>Created</span>}{!repoCreated && <span>Creating</span>} the
                                    GitHub repo
                                </td>
                                <td>{repoCreated &&
                                    <Button sx={openResourceStyle} variant="outlined"
                                            onClick={() => window.open(props.machine.state.context.browsableRepoUrl, "_blank")}>
                                        {"Open GitHub >"}
                                    </Button>}
                                </td>
                            </tr>
                            <tr>
                                <td>{workflowCompleted &&
                                    <CheckCircleOutlineOutlinedIcon className={moreClasses.icon}/>}
                                    {!workflowCompleted && <CircularProgress size={32}/>}</td>
                                <td>{workflowCompleted && <span>Completed</span>}{!workflowCompleted &&
                                    <span>Running</span>} the GitHub Actions workflow
                                </td>
                                <td>{workflowCompleted && <Button sx={openResourceStyle} variant="outlined"
                                                                  onClick={() => window.open(props.machine.state.context.browsableRepoUrl + "/actions", "_blank")}>
                                    {"Open Workflows >"}
                                </Button>}
                                </td>
                            </tr>
                            <tr>
                                <td>{spaceCreated && <CheckCircleOutlineOutlinedIcon className={moreClasses.icon}/>}
                                    {!spaceCreated && <CircularProgress size={32}/>}</td>
                                <td>{spaceCreated && <span>Created</span>}{!spaceCreated && <span>Creating</span>} the
                                    Octopus space
                                </td>
                                <td>{spaceCreated &&
                                    <Button sx={openResourceStyle} variant="outlined"
                                            onClick={() => window.open(getOctopusServer() + "/app#/configuration/spaces", "_blank")}>
                                        {"Open Workflows >"}
                                    </Button>}
                                </td>
                            </tr>
                        </table>
                    </Grid>
                </Grid>
                <Grid item md={3} xs={0}/>
            </Grid>
        </>
    );
};

export default Done;