import React from 'react';
import PathMatcher from './PathMatcher';
import Button from '@material-ui/core/Button';
import { resolvePath } from '../requests/NewRequestStepper';
import { cleanupPathComponentName, pathStringToPathComponents } from '../path-editor/PathInput';
import pathToRegexp from 'path-to-regexp';
import { RequestsHelper, RequestsCommands } from '../../engine';
import Typography from '@material-ui/core/Typography'
import { Sheet } from '../navigation/Editor'
import { withEditorContext } from '../../contexts/EditorContext';
import { withStyles } from '@material-ui/styles';
import { withRfcContext } from '../../contexts/RfcContext';
import Tooltip from '@material-ui/core/Tooltip';
import List from '@material-ui/core/List'
import ListItem from '@material-ui/core/ListItem'
import ListItemText from '@material-ui/core/ListItemText'


function completePathMatcherRegex(pathComponents) {
    const pathString = pathComponentsToString(pathComponents)
    const regex = pathToRegexp(pathString, [], { start: true, end: true })
    return regex;
}

export function pathComponentsToString(pathComponents) {
    if (pathComponents.length === 0) {
        return '/';
    }
    const s = '/' + pathComponents
        .map(({ name, isParameter }) => {
            if (isParameter) {
                const stripped = name
                    .replace('{', '')
                    .replace('}', '')
                    .replace(':', '');
                return `:${stripped}`;
            } else {
                return name;
            }
        }).join('/');
    return s
}

const styles = theme => ({
    root: {
        paddingTop: 22,
    }
});
class UnmatchedUrlWizard extends React.Component {
    state = {
        pathExpression: ''
    }
    handleChange = ({ pathExpression }) => {
        this.setState({
            pathExpression
        })
    }
    handleIgnore = () => {
        this.props.onIgnore()
    }
    handleSubmit = () => {
        const { cachedQueryResults } = this.props;
        const { pathsById } = cachedQueryResults;
        const { pathExpression } = this.state;

        const pathComponents = pathStringToPathComponents(pathExpression)
        const { toAdd, lastMatch } = resolvePath(pathComponents, pathsById)
        let lastParentPathId = lastMatch.pathId
        const commands = [];
        toAdd.forEach((addition) => {
            const pathId = RequestsHelper.newPathId()
            const command = (addition.isParameter ? RequestsCommands.AddPathParameter : RequestsCommands.AddPathComponent)(
                pathId,
                lastParentPathId,
                cleanupPathComponentName(addition.name)
            )
            commands.push(command)
            lastParentPathId = pathId
        })

        this.props.onSubmit({ commands })
    }
    render() {
        const { sample, items, classes } = this.props;
        const { pathExpression } = this.state;
        const regex = completePathMatcherRegex(pathStringToPathComponents(pathExpression))
        const { url } = sample.request;
        const isCompleteMatch = regex.exec(url)
        const urls = [...new Set(items.map(x => x.sample.request.url))]
        const matchingUrls = new Set(urls.filter(url => regex.exec(url)))

        const nextButton = (
            <Button
                onClick={this.handleSubmit}
                color="primary"
                disabled={!isCompleteMatch}>Add Path</Button>
        )
        const withTooltip = (
            <Tooltip title={'To continue the path you provide must be able to match the observed URL'}>
                <span>{nextButton}</span>
            </Tooltip>
        )

        return (
            <Sheet>
                <div className={classes.root}>
                    <Typography variant="h5">Unrecognized URL Observed</Typography>
                    <Typography variant="subtitle2" style={{ paddingTop: 11, paddingBottom: 11 }}>Optic observed a new URL. Before Optic can document the requests you need to add a matching path to your API specification.</Typography>

                    <PathMatcher
                        initialPathString={pathExpression}
                        url={url}
                        onChange={this.handleChange}
                    />

                    <div style={{ marginTop: 17, paddingTop: 4, textAlign: 'right' }}>
                        <Button
                            onClick={this.handleIgnore}
                            color="secondary">Skip Path</Button>
                        {!isCompleteMatch ? withTooltip : nextButton}
                    </div>
                </div>
                <div className={classes.root}>
                    <Typography variant="h5" style={{ paddingTop: 11, paddingBottom: 11 }}>Matching URLs</Typography>
                    <List>
                        {urls.map(url => {
                            return (
                                <ListItem button disabled={!matchingUrls.has(url)}>
                                    <ListItemText>{url}</ListItemText>
                                </ListItem>
                            )
                        })}
                    </List>
                </div>

            </Sheet>
        )
    }
}

export default withEditorContext(withRfcContext(withStyles(styles)(UnmatchedUrlWizard)))