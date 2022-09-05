import React from 'react';
import './App.css';
import {Button, EditableText, HTMLTable, Switch, Tab, Tabs} from "@blueprintjs/core";
import {Classes, Tooltip2} from "@blueprintjs/popover2";
import "./util";
import {CapoResult, compute_best_shift} from "./chords";

const defaultScores = [
    ["em", 5],
    ["e", 5],
    ["am", 5],
    ["am7", 5],
    ["c", 4],
    ["g", 4],
    ["g7", 4],
    ["a", 4],
    ["dm", 4],
    ["dm7", 4],
    ["d", 3],
    ["f", 3],
];

const defaultScoresText = defaultScores
    .map(pair => pair.join(": "))
    .join("\n");

type AppState = {
    chordsInput: string,
    scoreMapInput: string,
    result: CapoResult[],
    darkMode: boolean,
};

type Cookie = {
    chordsInput: string,
    scoreMapInput: string,
    darkMode: boolean,
}

class App extends React.Component<any, AppState> {

    constructor(props: any) {
        super(props);

        this.state = {
            chordsInput: "",
            result: [],
            scoreMapInput: defaultScoresText,
            darkMode: false,
        };
    }

    componentDidMount() {
        this.loadStateFromCookie();
    }

    componentDidUpdate(prevProps: Readonly<any>, prevState: Readonly<AppState>, snapshot?: any) {
        this.saveStateToCookie();
    }

    private saveStateToCookie() {
        const cookie: Cookie = {
            chordsInput: this.state.chordsInput,
            scoreMapInput: this.state.scoreMapInput,
            darkMode: this.state.darkMode,
        };
        document.cookie = JSON.stringify(cookie);
    }

    private loadStateFromCookie() {
        let cookie: Cookie | null = null;
        try {
            cookie = JSON.parse(document.cookie) as Cookie;
        } catch (e) {
        }
        if (cookie) {
            this.setState({
                chordsInput: cookie.chordsInput,
                scoreMapInput: cookie.scoreMapInput,
                darkMode: cookie.darkMode,
            });
        }
    }

    private renderSingleResult(r: CapoResult, bold?: boolean) {
        return (<tr>
            <td>
                {r.score.toFixed(1)}
            </td>
            <td style={{fontWeight: bold ? "bold" : "inherit"}}>
                {r.capo}
            </td>
            <td style={{fontWeight: bold ? "bold" : "inherit"}}>
                {r.chords.join(" ")}
            </td>
        </tr>);
    }

    private renderResults() {
        return (<div>
                <HTMLTable bordered={true}
                           condensed={true}>
                    <thead>
                    <tr>
                        <td>
                            <Tooltip2 className={Classes.TOOLTIP2_INDICATOR}
                                      content={"Sum over all chords according to your preferences."}>
                                Score
                            </Tooltip2>
                        </td>
                        <td>Capo</td>
                        <td>Chords</td>
                    </tr>
                    </thead>
                    <tbody>
                    {this.state.result.length > 0 ? <>
                        {this.renderSingleResult(this.state.result[0], true)}
                        {this.state.result.slice(1, 3).map(r => this.renderSingleResult(r))}
                    </> : [1, 2, 3].map(_ => <tr>
                        <td>&nbsp;</td>
                        <td/>
                        <td/>
                    </tr>)
                    }
                    </tbody>
                </HTMLTable>
            </div>
        );
    }

    private computeResult() {
        let chords = this.state.chordsInput.split(/\s+/);// split at white space of any length
        chords = chords.filter(c => c !== "");
        if (chords.length > 0) {
            const scoreMap = parseScoreMap(this.state.scoreMapInput);
            const result = compute_best_shift(chords, scoreMap);
            this.setState({result: result});
        }
    }

    renderChordPanel() {
        return (<div className={"panel"}>
            <p className={"subtle-text"}>
                Enter chords separated by spaces.
                Example: <code>E F# G#m</code>.
                More complex chords are also allowed,
                e.g. <code>G#maj7/F</code>.
            </p>
            <EditableText multiline={true} minLines={3} maxLines={12}
                          placeholder={"Enter Chords Here"}
                          confirmOnEnterKey={true}
                          value={this.state.chordsInput}
                          onChange={value => {
                              this.setState({chordsInput: value});
                          }}
                          onConfirm={() => this.computeResult()}
            />
            <br/>
            <Button intent={"primary"} text="Transpose"
                    onClick={() => this.computeResult()}/>
            <br/>
            <br/>
            {this.renderResults()}
        </div>);
    }

    renderPreferencesPanel() {
        return (<div className={"panel"}>
            <p className={"subtle-text"}>
                How much do you like each chord?
                Default is 0.
            </p>
            <EditableText multiline={true} minLines={12} maxLines={12}
                          value={this.state.scoreMapInput}
                          onChange={value => {
                              this.setState({scoreMapInput: value});
                          }}
            />
            <br/>
            <Button intent={"none"} text="Restore Defaults"
                    onClick={() => {
                        this.setState({scoreMapInput: defaultScoresText});
                    }}/>
            <br/>
            <br/>
            <Switch checked={this.state.darkMode} label={"Dark Mode"}
                    onChange={() => {
                        this.setState(prevState => ({darkMode: !prevState.darkMode}))
                    }}/>
        </div>);
    }

    renderAboutPanel() {
        return (<div className={"panel"}>
            Created by <a href={"https://github.com/tom-mohr"}
                          target={"_blank"} rel="noreferrer">github.com/tom-mohr</a>.
        </div>);
    }

    render() {
        return (
            <div className={this.state.darkMode ? "app app-dark bp4-dark" : "app app-light"}>
                <div className={"app-body"}>
                    <h1>Capo Finder</h1>
                    <p style={{textAlign: "center"}}>
                        This helps you transpose your chords so that they're easier to play.
                    </p>
                    <br/>
                    <Tabs vertical={true}>
                        <Tab key="chords-tab" id="chords-tab" title="Chords"
                             panel={this.renderChordPanel()}/>
                        <Tab key="scores-tab" id="scores-tab" title="Preferences"
                             panel={this.renderPreferencesPanel()}/>
                        <Tab key="about-tab" id="about-tab" title="About"
                             panel={this.renderAboutPanel()}/>
                    </Tabs>
                </div>
            </div>
        );
    }
}

function parseScoreMap(text: string) {
    const map = new Map<string, number>();
    const lines = text.split(/\n+/);
    lines
        .filter(line => line.includes(":"))
        .forEach(line => {
            let parts = line.split(/\s*:\s*/);
            if (parts.length === 2) {
                let key = parts[0];
                let score = 0;
                let parsed = true;
                try {
                    score = parseFloat(parts[1]);
                } catch (e) {
                    parsed = false;
                }
                if (parsed) {
                    map.set(key, score);
                }
            }
        });
    return map;
}

export default App;
