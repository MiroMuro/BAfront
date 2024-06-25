import { useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useApolloClient } from "@apollo/client";
const TimeOutDialog = ({ open, onClose, onRetry, errorMessage, setToken }) => {
  const navigate = useNavigate();
  const client = useApolloClient();
  const dialogRef = useRef(null);
  useEffect(() => {
    if (open) {
      dialogRef.current.showModal();
    } else {
      dialogRef.current.close();
    }
  }, [open]);

  const handleClick = (e) => {
    navigate("/login", { state: { logout: true } });
  };

  return (
    <dialog ref={dialogRef} className="p-2 border-2 border-red-400 rounded-md">
      <h2 className="bg-red-500 text-center rounded-md text-lg">ERROR!</h2>
      <p className="py-2">{errorMessage}</p>
      <div className=" flex justify-center">
        <button
          className="flex flex-col  items-center rounded-lg w-1/2 border-solid border-2 text-center border-black my-2 p-1 hover:bg-black hover:text-white hover:border-transparent transition ease-linear duration-500 scale-100 transform hover:scale-110"
          onClick={handleClick}
        >
          Login
        </button>
      </div>
    </dialog>
  );
};

export default TimeOutDialog;