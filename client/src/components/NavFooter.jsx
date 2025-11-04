import { Container, Navbar, Button} from "react-bootstrap";
import { useParams,useNavigate } from "react-router";
import { Link } from "react-router";
import "../App.css";
import API from "../API/API.mjs"; 


export function NavHeader(props) {

  return (
    <Navbar bg="dark" data-bs-theme="dark" className="nav"> 
      <Container fluid className="px-3"> 

        <Navbar.Brand className="nav-text">
          {props.user?.name ? <> Hi {props.user.name} </> : <>Hi</>}
        </Navbar.Brand>
        
        <Navbar.Brand className="nav">
        {props.user ?
          <Button onClick={props.handleLogout} variant="outline-light">Logout</Button> 
        : <Link to='/registration'className='btn btn-outline-light'>Register</Link>}
        </Navbar.Brand>
        
      </Container>
    </Navbar>
  );
}

