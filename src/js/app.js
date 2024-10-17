App = {
  web3Provider: null,
  contracts: {},
  account: '0x0',

  init: async function () {
    return await App.initWeb3();
  },

  initWeb3: async function () {
    // Modern dapp browsers...
    if (window.ethereum) {
      try {
        // Request account access
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        App.web3Provider = window.ethereum;
        web3 = new Web3(App.web3Provider);

        // Listen for account changes
        window.ethereum.on('accountsChanged', function (accounts) {
          App.account = accounts[0];
          $("#accountAddress").html("Your Account: " + App.account);
        });

        // Listen for chain changes
        window.ethereum.on('chainChanged', function (chainId) {
          // Handle the new chain.
          // Correctly handling chain changes can be complicated.
          // We recommend reloading the page unless you have good reason not to.
          window.location.reload();
        });
      } catch (error) {
        console.error("User denied account access");
        return;
      }
    }
    // Legacy dapp browsers or non-dapp browsers...
    else {
      console.log('Non-Ethereum browser detected. Consider installing MetaMask!');
      return;
    }
    return await App.initContract();
  },

  initContract: async function () {
    try {
      const response = await fetch('Election.json');
      const election = await response.json();

      // Instantiate a new truffle contract from the artifact
      App.contracts.Election = TruffleContract(election);
      // Connect provider to interact with contract
      App.contracts.Election.setProvider(App.web3Provider);
      App.listenForEvents();
      return await App.render();
    } catch (error) {
      console.error("Error loading contract:", error);
    }
  },

  castVote: function () {
    var candidateId = $('#candidatesSelect').val();
    App.contracts.Election.deployed().then(function (instance) {
      return instance.vote(candidateId, { from: App.account });
    }).then(function (result) {
      // Wait for votes to update
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      $("#content").hide();
      $("#loader").show();
    }).catch(function (err) {
      console.error(err);
    });
  },

  listenForEvents: function () {
    App.contracts.Election.deployed().then(function (instance) {
      instance.votedEvent({}, {
        fromBlock: 0,
        toBlock: 'latest'
      }).on('data', function (event) {
        console.log("event triggered", event);
        // Reload when a new vote is recorded
        App.render();
      }).on('error', console.error);  // Handle errors
    });
  },

  render: async function () {
    try {
      const loader = $("#loader");
      const content = $("#content");

      loader.show();
      content.hide();


      // Load account data
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      App.account = accounts[0];
      $("#accountAddress").html("Your Account: " + App.account);

      // Load contract data
      const electionInstance = await App.contracts.Election.deployed();
      const candidatesCount = await electionInstance.candidatesCount();

      const candidatesResults = $("#candidatesResults");
      const candidatesSelect = $('#candidatesSelect');

      candidatesResults.empty();
      candidatesSelect.empty();

      // Load candidates
      for (let i = 1; i <= candidatesCount; i++) {
        const candidate = await electionInstance.candidates(i);
        const id = candidate[0];
        const name = candidate[1];
        const voteCount = candidate[2];

        // Render candidate Result
        const candidateTemplate = "<tr><th>" + id + "</th><td>" + name + "</td><td>" + voteCount + "</td></tr>";
        candidatesResults.append(candidateTemplate);

        // Render candidate ballot option
        const candidateOption = "<option value='" + id + "' >" + name + "</option>";
        candidatesSelect.append(candidateOption);
      }

      // Check if user has voted
      const hasVoted = await electionInstance.voters(App.account);

      // Do not allow a user to vote if they have already voted
      if (hasVoted) {
        $('form').hide();
      }

      loader.hide();
      content.show();
    } catch (error) {
      console.error("Error rendering application:", error);
      loader.hide();
    }
  }
};


// Modern loading
document.addEventListener('DOMContentLoaded', function () {
  App.init();
});