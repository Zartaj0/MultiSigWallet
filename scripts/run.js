require("dotenv").config();

const send_abi = require("./abi.json");

let contract_address = "0x37c779a1564DCc0e3914aB130e0e787d93e21804"

ethersProvider = new ethers.providers.AlchemyProvider("maticmum",process.env.ALCHEMY_MUMBAI_API)

 
let arrayOfPrivateKeys = [
    process.env.PRIVATE_KEY3, 
    
]
let arrayOfOwners =["0x69A0d70271fb5C402a73125D95fadA17C55aD89A","0x1af9C19A1513B9D05a7E5CaAd9F9239EF54fE2b1","0xD6E5C56b74841d333938860F7949faa8F991d88D"];


async function createWallet(
    contract_address,
    _address,
    private_key,

) {
    for (const i of private_key) {

        let wallet = await new ethers.Wallet(i);
        let walletSigner = await wallet.connect(ethersProvider);

            if (contract_address) {
              
                let contract = await new ethers.Contract(
                    contract_address,
                    send_abi,
                    walletSigner
                )

            
                
                  await contract.CreateWallet(_address,3).then((transferResult) => {
                        console.dir(transferResult)
                    }).catch(error => console.log(error))
                
            }
    }

}

createWallet(
    contract_address,
    arrayOfOwners,
    
    arrayOfPrivateKeys
)