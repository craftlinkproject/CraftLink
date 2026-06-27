import React, { useEffect, useState } from "react";
import Nav from "../../../components/dashboard/components/Nav";
import SideBar from "../../../components/dashboard/components/SideBar";
import CreateCoursePage from "../../../components/dashboard/pages/CreateCoursePage";
import { useTheme } from "../../../context/ThemeContext";
const CreateCourse = () => {
  const [activeMenu, setActiveMenu] = useState(0);
  const [sidebarHide, setSidebarHide] = useState(false);
  const [searchShow, setSearchShow] = useState(false);
  const { darkMode, setDarkMode } = useTheme();

  const menuItems = ["Dashboard", "My Store", "Analytics", "Message", "Team"];

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) setSidebarHide(true);
      if (window.innerWidth > 576) setSearchShow(false);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div>
      <SideBar
        sidebarHide={sidebarHide}
        activeMenu={activeMenu}
        setActiveMenu={setActiveMenu}
        menuItems={menuItems}
      />

      <section id="content">
        <Nav
          sidebarHide={sidebarHide}
          setSidebarHide={setSidebarHide}
          searchShow={searchShow}
          setSearchShow={setSearchShow}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
        />

        <CreateCoursePage />
      </section>
    </div>
  );
};

export default CreateCourse;
