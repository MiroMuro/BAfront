import { useState, useEffect } from "react";
import { useQuery } from "@apollo/client";
import TimeOutDialog from "./TimeOutDialog";
import { useMutation } from "@apollo/client";
import useForm from "../hooks/useForm";
import { CREATE_BOOK, ALL_AUTHORS, AUTHOR_UPDATED } from "./queries";
const NewBook = ({ setToken, token }) => {
  const [bookInfo, handleChange, reset, addGenre] = useForm({
    title: "",
    author: "",
    published: 0,
    genre: "",
    genres: [],
  });
  // State for the animation of the message box.
  const [isAnimating, setIsAnimating] = useState(false);
  // State for the message box and its style.
  const [message, setMessage] = useState({
    text: "Add a new book!",
    style:
      "w-full max-w-xs py-2 bg-red-200 rounded mb-2 border-2 border-gray-400 text-center",
  });
  const { subscribeToMore } = useQuery(ALL_AUTHORS, {
    fetchPolicy: "cache-and-network",
  });
  // Open or close state for the dialog box.
  const [dialogOpen, setDialogOpen] = useState(false);
  // State for the dialog box content.
  const [messageBoxContent, setMessageBoxContent] = useState("");
  // State for the duplicate genre error message.
  const [isDuplicateGenre, setIsDuplicateGenre] = useState(false);
  // State for the processing animation.
  const [isProcessing, setIsProcessing] = useState(false);
  //This is used to the listen for author updates and update the cache
  //for the authors correct bookCount after a book is added.
  const resetMessage = () => {
    setTimeout(() => {
      setMessage({
        text: "Add a new book!",
        style:
          "w-full max-w-xs p-2 bg-red-200 rounded mb-2 border-2 border-gray-400 text-center",
      });
    }, 5000);
  };
  const triggerAnimation = (status) => {
    setIsAnimating(true);
    setTimeout(() => {
      setIsAnimating(false);
      if (!status) {
        setIsProcessing(false);
      }
    }, 1000);
  };

  const handleError = (error) => {
    console.log({ error });
    //triggerAnimation(false);
    //Error handling for network errors and token expiration.
    if (error.networkError) {
      const { code, result, extensions } = error.networkError;
      if (result && result.name === "TokenExpiredError") {
        setMessageBoxContent("You were timed out! Please log in again.");
        setDialogOpen(true);
      } else if (code === "DUPLICATE_BOOK_TITLE") {
        setMessage({
          text: "A book with the same title already exists!",
          style:
            "w-full max-w-xs p-2 bg-red-400 rounded mb-2 border-2 border-gray-400 text-center",
        });
        resetMessage();
      } else if (code === "BAD_BOOK_GENRES") {
        setMessage({
          text: extensions.message,
          style:
            "w-full max-w-xs p-2 bg-red-400 rounded mb-2 border-2 border-gray-400 text-center",
        });
        resetMessage();
      } else if (code === "NETWORK_ERROR") {
        setMessage({
          text: "A network error occurred. Please try again later.",
          style:
            "w-full max-w-xs p-2 bg-red-400 rounded mb-2 border-2 border-gray-400 text-center",
        });
        resetMessage();
      }
    }
  };

  useEffect(() => {
    if (!token) {
      setDialogOpen(true);
      setMessageBoxContent(
        "Please log in to add a book. Or continue as a guest."
      );
    }
    const unsubscribe = subscribeToMore({
      //This is the subscription query
      document: AUTHOR_UPDATED,
      // The return values replaces the cache with the updated author.
      updateQuery: (prev, { subscriptionData }) => {
        if (!subscriptionData.data) return prev;
        const updatedAuthor = subscriptionData.data.authorUpdated;

        return {
          allAuthors: prev.allAuthors.map((author) =>
            author.name === updatedAuthor.name ? updatedAuthor : author
          ),
        };
      },
    });

    return () => {
      unsubscribe();
      /*unsubscribeNewGenres();*/
    };
  }, [subscribeToMore]);

  //Mutation to add a new book
  const [addBook] = useMutation(CREATE_BOOK, {
    onError: (error) => {
      setTimeout(() => {
        setIsProcessing(false);
      }, 1000);
      setTimeout(() => {
        triggerAnimation(false);
        handleError(error);
      }, 1000);
      /*const messages = error.graphQLErrors.map((e) => e.message).join("\n");
      console.log(messages);*/
    },
    onCompleted: (data) => {
      console.log({ data });
      setTimeout(() => {
        setIsProcessing(false);
      }, 1000);
      setTimeout(() => {
        triggerAnimation(true);
        setMessage({
          text: `${data.addBook.title} by ${data.addBook.author.name} was added succesfully!`,
          style:
            "w-full max-w-xs p-2 bg-green-400 rounded mb-2 border-2 border-gray-400 text-center",
        });
      }, 1000);

      resetMessage();
    },

    refetchQueries: [{ query: ALL_AUTHORS }],
  });

  const submit = async (event) => {
    event.preventDefault();

    addBook({
      variables: {
        title: bookInfo.title,
        author: bookInfo.author,
        published: parseInt(bookInfo.published),
        genres: bookInfo.genres,
      },
    });
    reset();
  };

  //Must be rendered like this to prevent re-rendering on every key press.
  return (
    <div className="flex w-1/3">
      {token ? (
        <>
          <TimeOutDialog
            open={dialogOpen}
            onClose={() => setDialogOpen(false)}
            errorMessage={messageBoxContent}
            setToken={setToken}
          ></TimeOutDialog>
          <LoginView
            bookInfo={bookInfo}
            handleChange={handleChange}
            handleSubmit={submit}
            message={message}
            isAnimating={isAnimating}
            addGenre={addGenre}
            isDuplicateGenre={isDuplicateGenre}
            setIsDuplicateGenre={setIsDuplicateGenre}
            setIsProcessing={setIsProcessing}
            isProcessing={isProcessing}
          />
        </>
      ) : (
        <TimeOutDialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          errorMessage={"Please log in to add a book. Or continue as a guest."}
          setToken={setToken}
        ></TimeOutDialog>
      )}
    </div>
  );
};
const InputField = ({ label, name, value, onChange, type }) => (
  <div className="flex my-2 justify-between border-b-2 p-2 border-b-gray-400">
    <p> {label}</p>
    <input
      autoComplete="off"
      label={label}
      name={name}
      type={type}
      className="border-b-2 border-b-solid border-b-black"
      value={value}
      onChange={onChange}
    />
  </div>
);
const GenreInputField = ({
  label,
  name,
  value,
  onChange,
  type,
  isDuplicateGenre,
}) => (
  <div className="flex my-2 justify-between p-2 ">
    <label
      for="genresInput"
      className={`absolute ${
        isDuplicateGenre
          ? "duration-500 transform -translate-y-6 opacity-100 text-red-700"
          : "duration-500 transform -translate-y-6 opacity-0 fill-mode-forwards"
      }`}
    >
      {label}
    </label>
    <input
      className={`${
        isDuplicateGenre
          ? "border-transparent  border-red-500 outline-none ring-2 ring-red-500  transition duration-300"
          : ""
      }`}
      id="genresInput"
      autoComplete="off"
      label={label}
      name={name}
      type={type}
      value={value}
      onChange={onChange}
    />
  </div>
);
const AddBookButton = ({ type, bookInfo, setIsProcessing }) => {
  let isDisabled;
  if (
    bookInfo.title === "" ||
    bookInfo.author === "" ||
    bookInfo.published === 0 ||
    bookInfo.genres.length === 0
  ) {
    isDisabled = true;
  } else {
    isDisabled = false;
  }
  return (
    <button
      className="addBookButton"
      type={type}
      disabled={isDisabled}
      onClick={() => setIsProcessing(true)}
    >
      Add book
    </button>
  );
};
const AddGenreButton = ({
  addGenre,
  genre,
  genres,
  isDuplicateGenre,
  setIsDuplicateGenre,
}) => {
  if (genre === "") {
    setIsDuplicateGenre(false);
    return (
      <button className="addGenreButton" disabled>
        <p>Add genre</p>
      </button>
    );
  } else if (genres.includes(genre.toLowerCase()) || isDuplicateGenre) {
    setIsDuplicateGenre(true);
    return (
      <button className="addGenreButton  " disabled>
        <p>Add genre</p>
      </button>
    );
  } else {
    setIsDuplicateGenre(false);
    return (
      <button className="addGenreButton" onClick={addGenre}>
        <p>Add genre</p>
      </button>
    );
  }
};

//Show a message to the user when the book is being added. Or an loading circle.
const InfoBox = ({ isAnimating, isProcessing, message }) => {
  return (
    <div
      className={`${message.style} ${
        isAnimating ? "animate-scaleUpAndDown" : ""
      }`}
    >
      {isProcessing ? (
        <div className="flex items-center justify-center">
          <svg
            className="animate-spin h-6 w-6 mx-4 text-red-400 fill-red-600"
            viewBox="0 0 101 101"
          >
            <path
              d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
              fill="currentColor"
            />
            <path
              d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
              fill="currentFill"
            />
          </svg>
        </div>
      ) : (
        <p className="w-full break-words">{message.text}</p>
      )}
    </div>
  );
};
const LoginView = ({
  bookInfo,
  handleChange,
  handleSubmit,
  message,
  isAnimating,
  addGenre,
  setIsDuplicateGenre,
  isDuplicateGenre,
  isProcessing,
  setIsProcessing,
}) => (
  <div className="flex flex-col flex-wrap   flex-grow-0 justify-end break-words">
    <InfoBox
      isAnimating={isAnimating}
      isProcessing={isProcessing}
      message={message}
    />

    <h2 className="text-xl">Add a new book!</h2>
    <form
      className="flex flex-col border-gray-400 border-2 rounded-md overflow-hidden"
      onSubmit={handleSubmit}
    >
      <div className="bg-red-200">
        <InputField
          name="title"
          label="Title:"
          type="text"
          value={bookInfo.title}
          onChange={handleChange}
        />
        <InputField
          name="author"
          label="Author:"
          type="text"
          value={bookInfo.author}
          onChange={handleChange}
        />
        <InputField
          label="Published:"
          name="published"
          type="number"
          value={bookInfo.published}
          onChange={handleChange}
        />
        <div className="flex justify-between border-b-2 border-gray-200 pl-1 bg-red-200">
          <AddGenreButton
            addGenre={addGenre}
            genres={bookInfo.genres}
            genre={bookInfo.genre}
            setIsDuplicateGenre={setIsDuplicateGenre}
          />
          <GenreInputField
            name="genre"
            type="text"
            label="Duplicate genre!"
            value={bookInfo.genre}
            onChange={handleChange}
            isDuplicateGenre={isDuplicateGenre}
          />
        </div>
      </div>
      <div className="flex border-b-2 border-gray-200 p-2 bg-red-200">
        Genres:
        <span className="w-full max-w-56  break-words">
          {bookInfo.genres.join(" ")}
        </span>
      </div>
      <AddBookButton
        type={"submit"}
        bookInfo={bookInfo}
        setIsProcessing={setIsProcessing}
      />
    </form>
  </div>
);

export default NewBook;
