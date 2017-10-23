using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace WebRTC_Internship.Models.AccountViewModels
{
    public class ContactModel
    {
        public string ID { get; set; }
        public string Name { get; set; }
        public string Email { get; set; }
    }

    public class ContactViewModel : ContactModel
    {
        
    }
}
