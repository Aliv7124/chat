import React from "react";
import Search from "./Search";
import Users from "./Users";
import Logout from "./Logout";



function Left() {
  return (
    <div className="d-flex flex-column" style={{ height: "100%", backgroundColor: "#1a1a1a", color: "#ccc" }}>
      <Search />
      <div className="flex-grow-1 overflow-auto">
        <Users />
      </div>
      <Logout />
    </div>
  );
}

export default Left;