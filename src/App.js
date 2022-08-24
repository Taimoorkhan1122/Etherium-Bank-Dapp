import { useState, useEffect } from "react";
import { ethers, utils } from "ethers";
import abi from "./contracts/Bank.json";

function App() {
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [isBankerOwner, setIsBankerOwner] = useState(false);
  const [inputValue, setInputValue] = useState({
    withdraw: "",
    deposit: "",
    bankName: "",
  });
  const [bankOwnerAddress, setBankOwnerAddress] = useState(null);
  const [customerTotalBalance, setCustomerTotalBalance] = useState(null);
  const [currentBankName, setCurrentBankName] = useState(null);
  const [customerAddress, setCustomerAddress] = useState(null);
  const [error, setError] = useState(null);

  const contractAddress = "0x198AF1E1d1FA67dAfc097ef53E4701309bc21E0d";
  const contractABI = abi.abi;

  const checkIfWalletIsConnected = async () => {
    try {
      if (window.ethereum) {
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });
        const account = accounts[0];
        setIsWalletConnected(true);
        setCustomerAddress(account);
        console.log("Account Connected :", account);
      } else {
        setError("Please install a MetaMask wallet to use our bank.");
        console.log("No Metamask found");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const getBankName = async () => {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const bankContract = new ethers.Contract(
        contractAddress,
        contractABI,
        signer
      );

      let bankName = await bankContract.bankName();
      bankName = utils.parseBytes32String(bankName);
      setCurrentBankName(bankName.toString());
    } catch (error) {
      console.log(error);
    }
  };

  const setBankNameHandler = async (event) => {
    event.preventDefault();
    try {
      if (window.ethereum) {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const bankContract = new ethers.Contract(
          contractAddress,
          contractABI,
          signer
        );

        const txn = await bankContract.setBankName(
          utils.formatBytes32String(inputValue.bankName)
        );

        console.log("setting bank name...");
        txn.wait();
        console.log("Bank Name Changed", txn.hash);
        await getBankName();
      } else {
        console.log("ethereum object not found, install Metamask");
        setError("Please install Metamask wallet to use our bank");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const getbankOwnerHandler = async () => {
    try {
      if (window.ethereum) {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const bankContract = new ethers.Contract(
          contractAddress,
          contractABI,
          signer
        );

        let bankOwner = await bankContract.bankOwner();
        setBankOwnerAddress(bankOwner);

        const [account] = await window.ethereum.request({
          method: "eth_requestAccounts",
        });

        if (bankOwner.toLowerCase() === account.toLowerCase()) {
          setIsBankerOwner(true);
        }
      } else {
        console.log("ethereum object not found, install Metamask");
        setError("Please install Metamask wallet to use our bank");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const customerBalanceHandler = async () => {
    try {
      if (window.ethereum) {

        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const bankContract = new ethers.Contract(contractAddress, contractABI, signer);

        let balance = await bankContract.getCustomerBalance();
        setCustomerTotalBalance(utils.formatEther(balance));
        console.log("retrieved Balance...", customerTotalBalance);

      } else {
        console.log("ethereum object not found, install Metamask");
        setError("Please install Metamask wallet to use our bank");
      }

    } catch (error) {
      console.log(error);
    }
  };

  const handleInputChange = (event) => {
    setInputValue((prevFormData) => ({
      ...prevFormData,
      [event.target.name]: event.target.value,
    }));
  };

  const deposityMoneyHandler = async (event) => {
    try {
      event.preventDefault();
      if (window.ethereum) {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const bankContract = new ethers.Contract(contractAddress, contractABI, signer);

        let txn = await bankContract.depositMoney({ value: ethers.utils.parseEther(inputValue.deposit) });
        console.log("Depositing Money...");
        txn.wait()
        console.log("Deposited Money... done", txn.hash);

        customerBalanceHandler()

      } else {
        console.log("ethereum object not found, install Metamask");
        setError("Please install Metamask wallet to use our bank");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const withDrawMoneyHandler = async (event) => {
    try {
      event.preventDefault();
      if (window.ethereum) {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const bankContract = new ethers.Contract(contractAddress, contractABI, signer);

        const myAddress = await signer.getAddress();
        console.log("provider signer...", myAddress);

        let txn = await bankContract.withDrawMoney(myAddress, utils.parseEther(inputValue.withdraw));
        console.log("withdrawing Money...");
        txn.wait()
        console.log("Money withdrew... done", txn.hash);

        customerBalanceHandler()

      } else {
        console.log("ethereum object not found, install Metamask");
        setError("Please install Metamask wallet to use our bank");
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    checkIfWalletIsConnected();
    getBankName();
    getbankOwnerHandler();
    customerBalanceHandler();
  }, [isWalletConnected, currentBankName, customerTotalBalance]);

  return (
    <main className="main-container">
      <h2 className="headline">
        <span className="headline-gradient">Bank Contract Project</span> 💰
      </h2>
      <section className="customer-section px-10 pt-5 pb-10">
        {error && <p className="text-2xl text-red-700">{error}</p>}
        <div className="mt-5">
          {currentBankName === "" && isBankerOwner ? (
            <p>"Setup the name of your bank." </p>
          ) : (
            <p className="text-3xl font-bold">{currentBankName}</p>
          )}
        </div>
        <div className="mt-7 mb-9">
          <form className="form-style">
            <input
              type="text"
              className="input-style"
              onChange={handleInputChange}
              name="deposit"
              placeholder="0.0000 ETH"
              value={inputValue.deposit}
            />
            <button className="btn-purple" onClick={deposityMoneyHandler}>
              Deposit Money In ETH
            </button>
          </form>
        </div>
        <div className="mt-10 mb-10">
          <form className="form-style">
            <input
              type="text"
              className="input-style"
              onChange={handleInputChange}
              name="withdraw"
              placeholder="0.0000 ETH"
              value={inputValue.withdraw}
            />
            <button className="btn-purple" onClick={withDrawMoneyHandler}>
              Withdraw Money In ETH
            </button>
          </form>
        </div>
        <div className="mt-5">
          <p>
            <span className="font-bold">Customer Balance: </span>
            {customerTotalBalance}
          </p>
        </div>
        <div className="mt-5">
          <p>
            <span className="font-bold">Bank Owner Address: </span>
            {bankOwnerAddress}
          </p>
        </div>
        <div className="mt-5">
          {isWalletConnected && (
            <p>
              <span className="font-bold">Your Wallet Address: </span>
              {customerAddress}
            </p>
          )}
          <button className="btn-connect" onClick={checkIfWalletIsConnected}>
            {isWalletConnected ? "Wallet Connected 🔒" : "Connect Wallet 🔑"}
          </button>
        </div>
      </section>
      {isBankerOwner && (
        <section className="bank-owner-section">
          <h2 className="text-xl border-b-2 border-indigo-500 px-10 py-4 font-bold">
            Bank Admin Panel
          </h2>
          <div className="p-10">
            <form className="form-style">
              <input
                type="text"
                className="input-style"
                onChange={handleInputChange}
                name="bankName"
                placeholder="Enter a Name for Your Bank"
                value={inputValue.bankName}
              />
              <button className="btn-grey" onClick={setBankNameHandler}>
                Set Bank Name
              </button>
            </form>
          </div>
        </section>
      )}
    </main>
  );
}
export default App;
