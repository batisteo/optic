import React, {useState} from 'react';
import {ListItemSecondaryAction, makeStyles, Typography} from '@material-ui/core';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import Button from '@material-ui/core/Button';
import compose from 'lodash.compose';
import {withRfcContext} from '../../contexts/RfcContext';
import {getRequestIdsWithDiffs, getUnrecognizedUrlCount} from '../diff/DiffUtilities';
import {
  computeDiffStateProjections,
  TrafficSessionContext,
  TrafficSessionStore
} from '../../contexts/TrafficSessionContext';
import {Link} from 'react-router-dom';
import {DisplayPath} from '../paths/DisplayPath';
import {PathIdToPathString} from '../paths/PathIdToPathString';
import {withNavigationContext} from '../../contexts/NavigationContext';
import {
  AddedGreen,
  AddedGreenBackground,
  ChangedYellow,
  ChangedYellowBackground, ChangedYellowBright, RemovedRed,
  RemovedRedBackground, UpdatedBlue, UpdatedBlueBackground
} from '../../contexts/ColorContext';
import classNames from 'classnames';
import {MarkdownRender} from '../requests/DocContribution';
import {PURPOSE} from '../../ContributionKeys';
import Chip from '@material-ui/core/Chip';
import Menu from '@material-ui/core/Menu';
import LinearProgress from '@material-ui/core/LinearProgress';
import {primary} from '../../theme';
import Collapse from '@material-ui/core/Collapse';
import {withIntegrationsContext} from '../../contexts/IntegrationsContext';
import {IntegrationsSpecService} from '../routes/local/integrations';

const useStyles = makeStyles({
  section: {
    minHeight: 200,
    marginBottom: 110
  },
  chipNotif: {
    display: 'flex',
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 160,
  },
  menuItem: {
    marginTop: 30
  },
  menuList: {
    width: 550,
    padding: 0,
    outline: 'none'
  },
  notificationBar: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    userSelect: 'none',
    backgroundColor: primary,
    borderRadius: 10,
    paddingBottom: 10,
    cursor: 'pointer',
    transition: 'background-color 0.1s ease',
    '&:hover': {
      transition: 'background-color 0.2s ease',
      backgroundColor: '#3d4989'
    }
  },
  notification: {
    borderLeft: `5px solid ${AddedGreen}`,
    backgroundColor: AddedGreenBackground,
    paddingTop: 5,
    paddingBottom: 5,
    fontSize: 14,
    marginTop: 13,
    marginBottom: 13,
  },
  yellow: {
    borderLeft: `5px solid ${ChangedYellow}`,
    backgroundColor: ChangedYellowBackground,
  },
  red: {
    borderLeft: `5px solid ${RemovedRed}`,
    backgroundColor: RemovedRedBackground,
  },
  blue: {
    borderLeft: `5px solid ${UpdatedBlue}`,
    backgroundColor: UpdatedBlueBackground,
  },
  container: {
    marginBottom: 40
  }
});

function NewBehaviorCard({source, color, children}) {

  const classes = useStyles();

  const colorClass = color === 'red' ? classes.red : color === 'blue' ? classes.blue : classes.yellow;

  return (
    <div className={classNames(classes.notification, colorClass)}>
      <MarkdownRender source={source}/>
      {children}
    </div>
  );
}

function NewBehavior(props) {
  const classes = useStyles();
  const {sessionId, requestIdsWithDiffs, unrecognizedUrlCount, integrationsWithDiff, cachedQueryResults, baseUrl, isLoading} = props;
  const [anchorEl, setAnchorEl] = useState(false);

  if (isLoading) {
    return null;
  }

  const handleClick = event => {
    setAnchorEl(event.currentTarget);
  };

  const undocumentedBehavior = (
    <div className={classes.chipNotif} style={{marginTop: 0}}>
      <Chip label={requestIdsWithDiffs.length} size="small"
            style={{color: 'white', backgroundColor: RemovedRed}}/>
      <Typography variant="subtitle2" style={{color: 'white', marginLeft: 10, fontWeight: 200, fontSize: 12}}>Unexpected
        Behaviors</Typography>
    </div>
  );

  const newUrls = (
    <div className={classes.chipNotif}>
      <Chip label={unrecognizedUrlCount} size="small" style={{backgroundColor: ChangedYellowBright}}/>
      <Typography variant="subtitle2" style={{color: 'white', marginLeft: 10, fontWeight: 200, fontSize: 12}}>Undocumented
        URLs</Typography>
    </div>
  );


  const noNotifications = !requestIdsWithDiffs.length && !unrecognizedUrlCount;

  return (
    <Collapse in={true} appear={true} style={{width: '100%'}}>
      <div className={classes.notificationBar} onClick={handleClick} onMouseLeave={() => setAnchorEl(false)}>

        {integrationsWithDiff}

        <Typography variant="subtitle1" style={{color: 'white', marginTop: 5}}>Not Synced</Typography>

        {requestIdsWithDiffs.length > 0 && undocumentedBehavior}
        {unrecognizedUrlCount > 0 && newUrls}

        {noNotifications && (
          <div className={classes.chipNotif}>
            <Typography variant="h2">API and Specification are in Sync</Typography>
          </div>
        )}

        <Collapse in={Boolean(anchorEl) && !noNotifications} style={{width: '100%'}}>
          {unrecognizedUrlCount > 0 && (
            <Link style={{textDecoration: 'none', color: 'black'}}
                  to={`${baseUrl}/diff/${sessionId}/urls`}>
              <Button color="secondary" size="small" variant="contained" style={{marginTop: 20}}>Document new
                URLs</Button>
            </Link>
          )}

          <List>
            {requestIdsWithDiffs.map(requestId => {

              const {pathComponentId: pathId, httpMethod: method} = cachedQueryResults.requests[requestId].requestDescriptor;

              const path = <DisplayPath url={<PathIdToPathString pathId={pathId}/>} method={method}/>;

              const name = cachedQueryResults.contributions.getOrUndefined(requestId, PURPOSE);
              return (
                <Link style={{textDecoration: 'none', color: 'black'}}
                      to={`${baseUrl}/diff/${sessionId}/requests/${requestId}`}>
                  <ListItem dense button>
                    <ListItemText primary={name || path}
                                  secondary={name && path}
                                  primaryTypographyProps={{
                                    style: {
                                      fontSize: 12,
                                      color: 'white'
                                    }
                                  }}/>
                  </ListItem>
                </Link>
              );
            })}
          </List>
        </Collapse>

        {/*<Menu*/}
        {/*  className={classes.menuItem}*/}
        {/*  anchorEl={anchorEl}*/}
        {/*  MenuListProps={{className: classes.menuList}}*/}
        {/*  open={Boolean(anchorEl) && !noNotifications}>*/}
        {/*  <div style={{paddingLeft: 9}}>*/}

        {/*    {unrecognizedUrlCount === 0 && requestIdsWithDiffs.length === 0 && (*/}
        {/*      <Typography variant="subtitle2">No Notifications</Typography>*/}
        {/*    )}*/}

        {/*    {unrecognizedUrlCount > 0 && (*/}
        {/*      <NewBehaviorCard color="yellow" source={`##### ${unrecognizedUrlCount} Undocumented URLs`}>*/}
        {/*        <Link style={{textDecoration: 'none', color: 'black', float: 'right'}}*/}
        {/*              to={`${baseUrl}/diff/${sessionId}/urls`}>*/}
        {/*          <Button color="secondary" size="small" style={{marginTop: -58, marginRight: 8}}>Review & Document</Button>*/}
        {/*        </Link>*/}
        {/*      </NewBehaviorCard>*/}
        {/*    )}*/}

        {/*    <List>*/}
        {/*      {requestIdsWithDiffs.map(requestId => {*/}

        {/*        const {pathComponentId: pathId, httpMethod: method} = cachedQueryResults.requests[requestId].requestDescriptor;*/}

        {/*        const path = <DisplayPath url={<PathIdToPathString pathId={pathId}/>} method={method}/>;*/}

        {/*        const name = cachedQueryResults.contributions.getOrUndefined(requestId, PURPOSE);*/}
        {/*        return (*/}
        {/*          <ListItem dense>*/}
        {/*            <ListItemText primary={name || path}*/}
        {/*                          secondary={name && path}*/}
        {/*                          primaryTypographyProps={{*/}
        {/*                            style: {*/}
        {/*                              fontSize: 16*/}
        {/*                            }*/}
        {/*                          }}/>*/}
        {/*            <ListItemSecondaryAction>*/}
        {/*              <Link style={{textDecoration: 'none', color: 'black'}}*/}
        {/*                    to={`${baseUrl}/diff/${sessionId}/requests/${requestId}`}>*/}
        {/*                <Button size="small" color="secondary">Review Diff</Button>*/}
        {/*              </Link>*/}
        {/*            </ListItemSecondaryAction>*/}
        {/*          </ListItem>*/}
        {/*        );*/}
        {/*      })}*/}

        {/*    </List>*/}

        {/*  </div>*/}
        {/*</Menu>*/}
      </div>
    </Collapse>
  );
}


class NewBehaviorWrapper extends React.Component {
  state = {
    isLoading: true,
    lastSessionId: null,
    error: null
  };

  componentDidMount() {
    this.loadLatestSession();
  }

  componentDidUpdate() {
    this.loadLatestSession();
  }

  loadLatestSession() {
    const {specService} = this.props;
    specService
      .listSessions()
      .then(async (listSessionsResponse) => {
        const {sessions} = listSessionsResponse;
        if (sessions.length > 0) {
          const [lastSessionId] = sessions;
          if (lastSessionId !== this.state.lastSessionId) {
            this.setState({
              isLoading: false,
              lastSessionId,
            });
          }
        } else {
          this.setState({
            isLoading: false
          });
        }
      })
      .catch(e => {
        this.setState({
          isLoading: false,
          error: true
        });
      });
  }

  render() {
    const {lastSessionId, isLoading, error} = this.state;
    if (error) {
      return null;
    }

    if (isLoading) {
      return (<NewBehavior isLoading={true}/>);
    }

    const {isEmpty} = this.props;
    if (!lastSessionId) {
      if (isEmpty) {
        return (
          <NewBehaviorCard color="blue" source={`#### Finish Setting up Optic
Optic has not observed any API traffic yet. Make sure you have set up the proxy properly and sent traffic through the API.`}>
            <Button variant="contained" style={{margin: 8}} href="https://docs.useoptic.com" target="_blank">Read
              Docs</Button>
            <Button variant="contained" style={{margin: 8}} onClick={() => window.drift.api.sidebar.open()}>Chat with
              Support</Button>
            <Button variant="contained" style={{margin: 8}} href="https://calendly.com/optic-onboarding/setup-help"
                    target="_blank">Schedule On-boarding Call</Button>
          </NewBehaviorCard>
        );
      }
      return null;
    }
    const {specService, baseUrl, integrations = []} = this.props;
    return (
      <TrafficSessionStore sessionId={lastSessionId} specService={specService}>
        <TrafficSessionContext.Consumer>
          {(context) => {
            const {rfcId, rfcService} = this.props;
            const {cachedQueryResults, queries} = this.props;
            const {isLoading} = context;
            const diffStateProjections = computeDiffStateProjections(queries, cachedQueryResults, {session: context.session});
            const rfcState = rfcService.currentState(rfcId);
            const requestIdsWithDiffs = getRequestIdsWithDiffs(rfcState, diffStateProjections);
            const unrecognizedUrlCount = getUnrecognizedUrlCount(rfcState, diffStateProjections);
            if (unrecognizedUrlCount === 0 && requestIdsWithDiffs.length === 0) {
              return null;
            }

            const integrationsInSession = new Set(context.session.integrationSamples.map(i => i.integrationName));

            const integrationsWithDiff = integrations.filter(i => integrationsInSession.has(i.name)).map(i => {
              const integrationsSpecService = new IntegrationsSpecService(i.name);
              return (
                  <TrafficSessionStore sessionId={lastSessionId} specService={integrationsSpecService}>
                    <TrafficSessionContext.Consumer>
                      {(context) => {
                        const {rfcId, rfcService} = this.props;
                        const {cachedQueryResults, queries} = this.props;
                        const {isLoading} = context;
                        const diffStateProjections = computeDiffStateProjections(queries, cachedQueryResults, {session: context.session});

                        return <div>{i.name}</div>;
                      }}
                    </TrafficSessionContext.Consumer>
                  </TrafficSessionStore>
              );
            });

            return (
              <NewBehavior
                isLoading={isLoading}
                requestIdsWithDiffs={requestIdsWithDiffs}
                sessionId={lastSessionId}
                baseUrl={baseUrl}
                unrecognizedUrlCount={unrecognizedUrlCount}
                integrationsWithDiff={integrationsWithDiff}
                cachedQueryResults={cachedQueryResults}/>
            );
          }}
        </TrafficSessionContext.Consumer>

      </TrafficSessionStore>
    );
  }
}

export default compose(withRfcContext, withIntegrationsContext, withNavigationContext)(NewBehaviorWrapper);
