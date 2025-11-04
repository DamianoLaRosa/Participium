import "bootstrap/dist/css/bootstrap.min.css";
import { useState, useActionState} from "react";
import { Row, Col, Button,Form, Alert } from "react-bootstrap";
import { useNavigate } from "react-router";
import API from "../API/API.mjs"; 
import '../App.css'

export function LoginPage(props) {
  const [message,setMessage] = useState("");

  const handleLogin = async (credentials) => {
    try {
      const user = await API.logIn(credentials);
      setMessage({msg: `Welcome, ${user.name}!`, type: 'success'});
      props.setUser(user); 
    }catch(err) {
      setMessage({msg: err, type: 'danger'});
    }
  };

  return (
    <>
      {message && <Row><Alert variant={message.type} onClose={() => setMessage("")} dismissible>{message.msg}</Alert></Row>}

      <LoginForm handleLogin={handleLogin} message={message} user={props.user}/>

    </>
  );
}


function LoginForm(props) {
    const navigate = useNavigate();
    const [state, formAction, isPending] = useActionState(loginFunction, {username: '', password: ''});

    async function loginFunction(prevState, formData) {
        const credentials = {
            username: formData.get('username'),
            password: formData.get('password'),
        };

        try {
            await props.handleLogin(credentials); 
            return { success: true };
        } catch (error) {
            return {username: '', password: ''};
        }
    }

    return (
        <>
          { isPending && <Alert variant="warning">Please, wait for the server's response...</Alert> }

          <Row>
            <Col md={6} className="scrollable-content">
              <Form action={formAction}>
                <Form.Group controlId='username' className='mb-3'>
                  <Form.Label>Username</Form.Label>
                  <Form.Control type='text' name='username' required minLength={4} />
                </Form.Group>

                <Form.Group controlId='password' className='mb-3'>
                  <Form.Label>Password</Form.Label>
                  <Form.Control type='password' name='password' required minLength={6} />
                </Form.Group>

                <div className="footer-buttons">
                  <Button type='submit' disabled={isPending}>Login</Button>
                </div>
              </Form>
            </Col>
          </Row>
        </>
    );
}
