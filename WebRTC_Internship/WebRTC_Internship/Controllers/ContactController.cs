using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using WebRTC_Internship.Models;
using System.Web;
using WebRTC_Internship.Data;
using Microsoft.AspNetCore.Identity;
using WebRTC_Internship.Services;
using Microsoft.Extensions.Logging;
using Microsoft.AspNetCore.Http;

namespace WebRTC_Internship.Controllers
{
    [RequireHttps]
    [Authorize]
    [Route("/api/[controller]/[action]")]
    public class ContactController : Controller
    {
        //Define managers
        private UserManager<ApplicationUser> _userManager;
        private SignInManager<ApplicationUser> _signInManager;
        private IEmailSender _emailSender;
        private ILogger _logger;

        public ContactController(
            UserManager<ApplicationUser> userManager,
            SignInManager<ApplicationUser> signInManager,
            IEmailSender emailSender,
            ILogger<AccountController> logger)
        {
            _userManager = userManager;
            _signInManager = signInManager;
            _emailSender = emailSender;
            _logger = logger;
        }

        //Connect to Contacts database
        private VideochatDBContext db = new VideochatDBContext();

        //Gets current user
        public String getcurrentuser()
        {
            string returnstring = "";
            returnstring += _userManager.GetUserId(User);
            return returnstring;
        }

        public IActionResult Contact()
        {
            return Redirect("https://www.herreweb.nl/api/Contact/Home");
        }

        public IActionResult Home()
        {
            return View();
        }

        public String getcontacts()
        {
            string id = _userManager.GetUserId(User);
            var contacts = db.Contact.Where<ContactModel>(b => b.User_ID == id);
            string returnstring = "";
            foreach(var item in contacts)
            {
                returnstring += item.Name + ";" + item.UUID + "|";
            }
            return returnstring;
        }

        [HttpGet("{username}")]
        public async Task<IActionResult> Addcontact(string username)
        {
            string name = User.Identity.Name;
            string id = _userManager.GetUserId(User);
            var user = await _userManager.FindByNameAsync(username);
            if (user != null && id != null)
            {
                ContactModel contact = new ContactModel();
                contact.User_ID = id;
                contact.UUID = user.Id;
                contact.Status = ContactStatus.Submitted;
                contact.Email = user.Email;
                contact.Name = user.UserName;
                contact.ContactUUID = id + user.Id;
                if (ModelState.IsValid)
                {
                    db.Contact.Add(contact);
                    db.SaveChanges();
                    return Content("200");
                }
                else
                {
                    return Content("400");
                }
            }
            return Content("401");
        }

        [HttpGet("{contactid}")]
        public IActionResult ShowContact(string contactid)
        {
            string text = "";
            foreach (ContactModel contact in db.Contact)
            {
                if(contact.User_ID == contactid)
                {
                    text += contact.ContactUUID.ToString() + "\n";
                }

            }
            return Content(text);
        }

        [HttpGet("{searchquery}")]
        public async Task<string> Search(string searchquery)
        {
            searchquery.ToLower();
            var userlist = _userManager.Users.ToList();
            string returnstring ="";
            foreach(var item in userlist)
            {
                if (item.UserName.ToLower().Contains(searchquery)) { returnstring += item.UserName.ToString() + ";" + item.Id.ToString() +"|"; } 
            }
            return returnstring;
        }
    }
}