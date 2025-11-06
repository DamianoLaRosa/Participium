import { Outlet } from "react-router";
import { Header } from "../header/Header";
import { Container } from "react-bootstrap";
import styles from "./layout.module.css";

export function DefaultLayout(props) {
  return (
    <div className={styles.pageLayout}>
      <Header user={props.user} handleLogout={props.handleLogout} />

      <div className={styles.contentArea}>
        <Container fluid className="px-3">
          <Outlet />
        </Container>
      </div>
    </div>
  );
}
