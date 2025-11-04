import { Outlet } from "react-router";
import { NavHeader } from "./NavFooter";
import { Container} from "react-bootstrap";

export function DefaultLayout(props) {
  return (
    <div className="body-layout">
      <NavHeader user={props.user} handleLogout={props.handleLogout}/>

      <Container fluid className="px-3"> 
        <Outlet />
      </Container>

    </div>
  );
}





      
      


      
           
        
      
