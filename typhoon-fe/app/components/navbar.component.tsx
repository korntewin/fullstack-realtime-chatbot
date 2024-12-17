"use client";

import { signOut, useSession } from "next-auth/react";
import styled from "styled-components";
import { useState } from "react";
import Image from "next/image";

export default function NavBar() {
  const { data: session } = useSession();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleSignOut = () => {
    signOut();
  };

  const handleDropdownClick = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const getInitial = (name: string) => {
    return name ? name.charAt(0).toUpperCase() : "U";
  };

  return (
    <NavBarContainer>
      <Logo>
        {" "}
        {
          <Image
            alt="Typhoon icon"
            src="/typhoon-icon.png"
            width="50"
            height="50"
          />
        }{" "}
        TYPHOON
      </Logo>
      {session && (
        <UserMenu>
          <NameIcon onClick={handleDropdownClick}>
            {getInitial(session.user?.name || "A")}
          </NameIcon>
          <UserDetails onClick={handleDropdownClick} role="button">
            <div className="user-display">
              <span className="name">{session.user?.name}</span>
              <ArrowIcon
                transform={isDropdownOpen ? "rotate(180deg)" : "rotate(0)"}
                className="arrow-icon"
              />
            </div>
            <DropdownMenu
              display={isDropdownOpen ? "block" : "none"}
              opacity={isDropdownOpen ? "1" : "0"}
              transform={isDropdownOpen ? "translateY(0)" : "translateY(-10px)"}
              visibility={isDropdownOpen ? "visible" : "hidden"}
              className="dropdown-menu"
            >
              <SignOutButton onClick={handleSignOut}>Sign Out</SignOutButton>
            </DropdownMenu>
          </UserDetails>
        </UserMenu>
      )}
    </NavBarContainer>
  );
}

const NavBarContainer = styled.nav`
  position: sticky;
  top: 0;
  width: 100%;
  background: transparent;
  color: #e0e0e0;
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: 1000;
`;

const Logo = styled.div`
  font-size: 1.8rem;
  font-weight: bold;
  letter-spacing: 2px;
  color: white;
  cursor: pointer;
  transition: color 0.3s;
  align-items: center;
  display: flex;

  &:hover {
    color: #3b82f6;
  }
`;

const UserMenu = styled.div`
  display: flex;
  align-items: center;
  gap: 0.8rem;
`;

const NameIcon = styled.div`
  background-color: #60a5fa;
  color: #ffffff;
  font-size: 1.2rem;
  font-weight: bold;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 60%;
  border: 0.1px solid #ffffff;
  text-transform: uppercase;
`;

const ArrowIcon = styled.div<{ transform: string }>`
  width: 0;
  height: 0;
  border-left: 5px solid transparent;
  border-right: 5px solid transparent;
  border-top: 5px solid #e0e0e0;
  transition: transform 0.3s;

  transform: ${(props) => props.transform};
`;

const UserDetails = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  cursor: pointer;

  .user-display {
    display: flex;
    align-items: center;
  }

  .name {
    font-size: 1rem;
    font-weight: 600;
    color: #ffffff;
    transition: color 0.3s;
    margin-right: 0.3rem;

    &:hover {
      color: #60a5fa;
    }
  }
`;

const DropdownMenu = styled.div<{
  display: string;
  opacity: string;
  transform: string;
  visibility: string;
}>`
  position: absolute;
  top: 100%;
  left: 0;
  background-color: #252535;
  border: 1px solid #3e3e5a;
  border-radius: 5px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
  padding: 0.5rem 0;
  margin-top: 0.5rem;
  width: 100%;
  min-width: max-content;
  z-index: 10;

  display: ${(props) => props.display};
  opacity: ${(props) => props.opacity};
  transform: ${(props) => props.transform};
  visibility: ${(props) => props.visibility};
  transition: opacity 0.3s ease, transform 0.3s ease, visibility 0.3s ease;
`;

const SignOutButton = styled.button`
  background: transparent;
  border: none;
  color: #e0e0e0;
  font-size: 0.9rem;
  padding: 0.5rem 1rem;
  cursor: pointer;
  text-align: left;
  width: 100%;
  transition: color 0.3s;

  &:hover {
    color: #60a5fa;
  }
`;
