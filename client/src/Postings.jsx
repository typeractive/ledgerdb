import React from 'react';
import moment from 'moment';

import AccountSelect from './shared/AccountSelect';
import DateInput from './shared/DateInput';
import FadeIn from './shared/FadeIn';
import Fortune from './shared/Fortune';
import Message from './shared/Message';
import PromiseContainer from './shared/PromiseContainer';
import { DATE_FORMAT_MDY } from './shared/DateInput';
import { fetchCheck, fetchJSON } from './fetch';
import { formatAmount, formatDate } from './formatters';

class PostingsSearchForm extends React.PureComponent {

  constructor(props) {
    super(props);

    this.state = {
      s: "",  // Search query
      d1: "", // Start date
      d2: "", // End date
      a: []   // Account(s)
    };

    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleClear = this.handleClear.bind(this);
  }

  componentDidMount() {
    document.title = "LedgerDB - Postings";
  }

  handleChange(e) {
    if (e.target.type == "select-multiple") {
      this.setState({[e.target.id]: Array.from(e.target.selectedOptions).map(o => o.value)});
    } else {
      this.setState({[e.target.id]: e.target.value});
    }
  }

  handleClear(e) {
    e.preventDefault();
    this.setState({ s: "", d1: "", d2: "", a: [] });
  }

  handleSubmit(e) {
    e.preventDefault();

    const params = {};
    for (const s of [this.state.s.trim()]) {
      if (s) params.s = s;
    }
    for (const d of ["d1", "d2"]) {
      const m = moment(this.state[d], DATE_FORMAT_MDY, true); // use strict parsing
      if (m.isValid()) {
        params[d] = m.format("YYYY-MM-DD");
      }
    }
    if (this.state.a.length > 0) {
      params.a = this.state.a.join(" "); // space will be encoded as +
    }

    const querystring = $.param(params, true).replace(/%20/g, "+");
    if (querystring.length == 0) {
      document.getElementById('s').focus();
    } else {
      this.props.onSubmit(querystring);
    }

  }

  render() {
    return (
      <form className="form-horizontal" onSubmit={this.handleSubmit}>
        <div className="form-group">
          <label htmlFor="s" className="col-sm-3 control-label">Search:</label>
          <div className="col-sm-9">
            <div className="input-group">
              <input id="s" name="s" type="text"
                className="form-control"
                value={this.state.s}
                onChange={this.handleChange}
              />
              <span className="input-group-btn">
                <button type="submit" className="btn btn-default">
                  <i className="fa fa-search" aria-hidden="true"></i> Search
                </button>
              </span>
            </div>
          </div>
        </div>
        <div className="form-group">
          <label className="col-sm-3 control-label">By date:</label>
          <div className="col-sm-9">
            <div className="pull-left">
              <small>Start date:</small>
              <br/>
              <DateInput id="d1"
                format={DATE_FORMAT_MDY}
                value={this.state.d1}
                onChange={date => this.setState({d1: date})}
              />
            </div>
            <div className="pull-left">
              <small>End date:</small>
              <br/>
              <DateInput id="d2"
                format={DATE_FORMAT_MDY}
                value={this.state.d2}
                onChange={date => this.setState({d2: date})}
              />
            </div>
          </div>
        </div>
        <div className="form-group">
          <label className="col-sm-3 control-label">By account:</label>
          <div className="col-sm-9">
            <PromiseContainer
              wait={false}
              promises={{
                accountTypes: this.props.accountTypes,
                accounts: this.props.accounts
              }}>
              <AccountSelect
                className="form-control"
                multiple="multiple"
                size="15"
                id="a"
                value={this.state.a}
                onChange={this.handleChange}
              />
            </PromiseContainer>
          </div>
        </div>
        <div className="form-group">
          <div className="col-sm-offset-3 col-sm-9">
            <button type="submit" className="btn btn-primary">
              <i className="fa fa-search" aria-hidden="true"></i> Search
            </button>
            {" "}
            <button type="reset" className="btn btn-default" onClick={this.handleClear}>
              <i className="fa fa-eraser" aria-hidden="true"></i> Clear
            </button>
          </div>
        </div>
      </form>
    );
  }

}

class PostingsSearchResults extends React.PureComponent {

  constructor(props) {
    super(props);

    this.accounts = {};
    props.accounts.forEach(a => {
      this.accounts[a.accountId] = a;
    });

    this.state = {
      postings: props.postings,
      postingsToDelete: new Set(),
      err: null
    };
  }

  componentDidMount() {
    document.title = "LedgerDB - Postings - Search Results";
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.postings.length != this.state.postings.length ||
        !nextProps.postings.every((posting, i) =>
          posting.postingHeaderId ===
            this.state.postings[i].postingHeaderId)) {
      this.setState({postings: nextProps.postings});
    }
  }

  getAccountName(accountId) {
    return this.accounts[accountId] &&
      this.accounts[accountId].name;
  }

  handleDelete(entry, e) {
    e.preventDefault();
    const postingHeaderId = entry[0].postingHeaderId;
    this.setState(prevState => ({
      postingsToDelete: new Set([
        ...prevState.postingsToDelete,
        postingHeaderId
      ])
    }));
    fetch('api/posting/' + postingHeaderId, {
      method: 'DELETE',
      headers: { 'Authorization': sessionStorage.token }
    }).then(fetchCheck).then(res => {
      this.setState(prevState => ({
        postings: prevState.postings.filter(
          posting => posting.postingHeaderId != postingHeaderId
        ),
        postingsToDelete: new Set([...prevState.postingsToDelete].filter(
          postingHeaderId => postingHeaderId != postingHeaderId
        ))
      }));
    }).catch(err => this.setState({ err: err }));
  }

  render() {
    const p = new URLSearchParams(this.props.search);

    const list = [];
    if (p.has("s")) {
      list.push(
        <li key="s">Keywords: {p.get("s")}</li>
      );
    }
    if (p.has("d1")) {
      list.push(
        <li key="d1">Start date: {moment(p.get("d1")).format(DATE_FORMAT_MDY)}</li>
      );
    }
    if (p.has("d2")) {
      list.push(
        <li key="d2">End date: {moment(p.get("d2")).format(DATE_FORMAT_MDY)}</li>
      );
    }
    if (p.has("a")) {
      list.push(
        <li key="a">Accounts:
          <ul>
            {p.get("a").split(" ").map(a => (
              <li key={a}>{a} - {this.getAccountName(a)}</li>
            ))}
          </ul>
        </li>
      );
    }

    const count = this.state.postings.length;
    const entries = this.state.postings.reduce((entries, posting, i) => {
      if (entries.length > 0 &&
          entries[entries.length - 1][0].postingHeaderId == posting.postingHeaderId) {
        entries[entries.length - 1].push(posting);
      } else {
        entries.push([posting]);
      }
      return entries;
    }, []);

    const rows = entries.map(entry => (
      <tr key={entry[0].postingHeaderId}>
        <td className="text-nowrap">{formatDate(entry[0].postingDate)}</td>
        <td className="text-nowrap">
          {entry.map((posting) => this.renderSpan1(
            posting,
            this.getAccountName(posting.accountId)
          ))}
        </td>
        <td className="text-nowrap text-right">
          {entry.map((posting) => this.renderSpan2(
            posting,
            formatAmount(posting.amount)
          ))}
        </td>
        <td>{entry[0].description}</td>
        <td className="text-nowrap text-right">
          <span className="le-table-row-control">
            {this.state.postingsToDelete.has(entry[0].postingHeaderId) ? (
              <a href="#"
                className="btn btn-default disabled"
                role="button"
                aria-label="Delete"
              >
                <i className="fa fa-spinner fa-pulse fa-fw" aria-hidden="true" title="Delete"></i>
              </a>
            ) : (
              <a href="#" onClick={this.handleDelete.bind(this, entry)}
                className="btn btn-default"
                role="button"
                aria-label="Delete"
              >
                <i className="fa fa-trash-o fa-fw" aria-hidden="true" title="Delete"></i>
              </a>
            )}
          </span>
        </td>
      </tr>
    ));

    return (
      <div>
        <h3>Search Results</h3>
        <Message message={this.state.err}/>
        <p>Found {count} posting{count == 1 ? "" : "s"}.</p>
        <ul>{list}</ul>
        <section>
          <table className="table table-striped table-condensed">
            <thead>
              <tr>
                <th className="col-md-1">Date</th>
                <th className="col-md-2">Account</th>
                <th className="col-md-1">Amount</th>
                <th className="col-md-7">Description</th>
                <th className="col-md-1"> </th>
              </tr>
            </thead>
            <tbody>{rows}</tbody>
          </table>
        </section>
        <hr/>
        <Fortune
          style={{
            whiteSpace: "pre-wrap",
            float: "right",
            marginTop: '30px',
            fontSize: '0.8em'
          }}
        />
      </div>
    );
  }

  renderSpan1(posting, content) {
    let props = { key: posting.postingDetailId };
    if (posting.amount < 0) props.className = 'le-pad-left';
    return (
      <span {...props}>
        {content}
        <br/>
      </span>
    );
  }

  renderSpan2(posting, content) {
    let props = { key: posting.postingDetailId };
    if (posting.amount > 0) props.className = 'le-num-pos le-pad-right';
    if (posting.amount < 0) props.className = 'le-num-neg';
    return (
      <span {...props}>
        {content}
        <br/>
      </span>
    );
  }

}

class Postings extends React.PureComponent {

  constructor(props) {
    super(props);

    this.accountTypes = fetchJSON("api/account_type");
    this.accounts = fetchJSON("api/account");

    this.handleSubmit = this.handleSubmit.bind(this);

    const querystring = props.location.search;
    if (querystring) {
      this.search(querystring);
    }
  }

  componentWillReceiveProps(nextProps) {
    const querystring = nextProps.location.search;
    if (querystring && querystring != this.props.location.search) {
      this.search(querystring);
    }
  }

  handleSubmit(querystring) {
    this.props.history.push(this.props.location.pathname + "?" + querystring);
  }

  search(querystring) {
    const url = 'api/posting' +
      (querystring.startsWith("?")
        ? querystring
        : "?" + querystring);
    this.postings = fetch(url, {
      method: 'get',
      headers: { 'Authorization': sessionStorage.token }
    }).then(fetchJSON);
  }

  render() {
    let content;
    if (!this.props.location.search) {
      content = (
        <PostingsSearchForm
          accountTypes={this.accountTypes}
          accounts={this.accounts}
          onSubmit={this.handleSubmit}
        />
      );
    } else {
      content = (
        <PromiseContainer promises={{
          accounts: this.accounts,
          postings: this.postings
        }}>
          <PostingsSearchResults
            search={this.props.location.search}
          />
        </PromiseContainer>
      );
    }
    return (
      <FadeIn transitionName="transition-fade" timeout={500}>
        {content}
      </FadeIn>
    );
  }
}

export default Postings;
