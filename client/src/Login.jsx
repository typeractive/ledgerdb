import React from 'react';

class Login extends React.Component {

  constructor(props) {
    super(props);
    this.state = { running: false, err: null, user: '', pass: '' };
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  componentDidMount() {
    document.title = "LedgerDB";
  }

  handleSubmit(e) {
    e.preventDefault();
    this.setState({ running: true, err: null });

    let token = 'Basic ' + btoa(this.state.user + ':' + this.state.pass);

    fetch('api/login', {
      method: 'get',
      headers: { 'Authorization': token }
    })
      .then(res => {
        if (res.ok) {
          this.setState({ running: false, err: null });
          let auth = { user: this.state.user, token: token };
          let remember = document.getElementById('inputRemember').checked;
          this.props.app.setAuth(auth, remember);
        } else {
          throw Error(res.statusText);
        }
      })
      .catch(err => {
        this.setState({ running: false, err: err });
      });
  }

  handleChange(field, e) {
    let state = this.state;
    state[field] = e.target.value;
    this.setState(state);
  }

  renderButton() {
    if (this.state.running)
      return (
        <button className="btn btn-lg btn-primary btn-block disabled" type="submit" disabled>
          <i className="fa fa-circle-o-notch fa-spin"></i> Logging in...
        </button>
      );
    else
      return (
        <button className="btn btn-lg btn-primary btn-block" type="submit">
          <i className="fa fa-key" aria-hidden="true"></i> Log in
        </button>
      );
  }

  render() {
    let err;
    if (this.state.err) {
      err = (
        <div className="alert alert-danger alert-dismissable" role="alert">
          <button type="button" className="close" aria-label="Close" onClick={()=>this.setState({err:null})}>
            <span aria-hidden="true">&times;</span>
          </button>
          {this.state.err.message}
        </div>
      );
    }
    return (
      <div className="container">
        <form onSubmit={this.handleSubmit} className="form-signin">
          <h2 className="form-signin-heading">
            <i className="fa fa-bar-chart" aria-hidden="true"></i> LedgerDB
          </h2>
          <label for="inputUser" className="sr-only">Username</label>
          <input type="text" id="inputUser" className="form-control"
            placeholder="Username" required autofocus
            onChange={this.handleChange.bind(this, 'user')}
            />
          <label for="inputPass" className="sr-only">Password</label>
          <input type="password" id="inputPass" className="form-control"
            placeholder="Password"
            onChange={this.handleChange.bind(this, 'pass')}
            />
          <div className="checkbox">
            <label>
              <input type="checkbox" id="inputRemember" value="remember-me"/> Remember me
            </label>
          </div>
          <p>{this.renderButton()}</p>
          {err}
        </form>
      </div>
    );
  }

}

export default Login;