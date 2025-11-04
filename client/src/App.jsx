import "bootstrap/dist/css/bootstrap.min.css";
import { Routes, Route, Navigate } from "react-router";
import { DefaultLayout } from "./components/Layout";
import { LoginPage } from "./components/LoginPage";
import { useNavigate } from "react-router";
import { useEffect, useState } from "react";
import API from "./API/API.mjs";
import "./App.css";

function App() {
  const navigate = useNavigate();
  
  const [user, setUser] = useState(null);


  useEffect(() => {
    const checkAuth = async () => {
      try{
        const user = await API.getUserInfo(); // we have the user info here
        setUser(user);

      }catch(err){
        // do nothing
        setUser(null);
      }
    };
    checkAuth();
  }, []);

  const handleLogout = async () => {
    await API.logOut();
    setUser(null);
    navigate('/');
  };


  
  return (
    <Routes>
      
      <Route element={<DefaultLayout user={user} handleLogout={handleLogout}/>}>
        
        <Route path="/" element={ user? <></> : <LoginPage user={user} setUser={setUser} />}/>

        <Route path="*" element={<Navigate to="/" />} />

      </Route>
    </Routes>
  );
}

export default App;

