import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

function ProfileMenu({ user, balance }) {

  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const menuRef = useRef(null);

 const logout = () => {
  localStorage.removeItem("userId");
  window.location.href = "/";
};

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="profile-container" ref={menuRef}>

      <div
        className={`profile-avatar ${open ? "active" : ""}`}
        onClick={() => setOpen(!open)}
      >
        {user ? user.charAt(0).toUpperCase() : "U"}
      </div>

      {open && (
        <div className="profile-dropdown animate-pop">

          <div className="dropdown-header">
            <p className="user-name">{user}</p>
            <p className="user-status">Active Account</p>
          </div>

          <div className="dropdown-divider"></div>

          
        </div>
      )}

    </div>
  );
}

export default ProfileMenu;