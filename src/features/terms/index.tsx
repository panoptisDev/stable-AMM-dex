import React from "react";
import Modal from 'react-modal';

const customStyles = {
    content: {
      top: '50%',
      left: '50%',
      right: 'auto',
      bottom: 'auto',
      marginRight: '-50%',
      transform: 'translate(-50%, -50%)',
      maxWidth: '500px',
      backgroundColor: '#132562',
      color: 'white',
      borderColor: '#1F357D',
      borderRadius: 0,
      borderWidth: '2px',
      textAlign: 'center' as 'center'
    },
    overlay: {
        backgroundColor: '#161616ba',    
        zIndex: 99    
    },
  };

const TermsOfUse = () => {    
    const [modalIsOpen, setIsOpen] = React.useState(true);        

    function openModal() {
      setIsOpen(true);
    }

    function afterOpenModal() {        
        let visited = localStorage["alreadyVisited"];
       // console.log(visited)
        if(visited === 'true') {
             setIsOpen(false)
             //do not view Popup
        } else {
             //this is the first time
             localStorage["alreadyVisited"] = 'false';
             setIsOpen(true)
        }      
    }

    function closeModalAccept() {
      localStorage.setItem('alreadyVisited', 'true');
      setIsOpen(false);
    }

    function closeModalDecline() {
        localStorage.setItem('alreadyVisited', 'false');
       window.location.replace("https://google.com")
        setIsOpen(false);
      }

    return (
        <>
            <Modal
              isOpen={modalIsOpen}
              onAfterOpen={afterOpenModal}
              onRequestClose={closeModalDecline}
              style={customStyles}
              contentLabel="Example Modal"          
                
            >
              <div className="terms-popup">
                <h2>Terms of use and Privacy policy</h2>
                <p>By accessing our websites you agree to the <a style={{color: 'aqua'}} href="https://beamswap.io/terms" target={"_blank"} rel="noreferrer">terms of use</a> and <a href="https://beamswap.io/privacy" rel="noreferrer" target={"_blank"} style={{color: 'aqua'}}>privacy policy.</a></p>

                <div className="btns-wrapper">
                    <div className="accept" onClick={closeModalAccept}>Accept</div>
                    <div className="decline" onClick={closeModalDecline}>Decline</div>
                </div>                
              </div>
            </Modal>
        </>
    );
};

export default TermsOfUse;